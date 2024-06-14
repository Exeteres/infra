import { pulumi, random, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ApplicationOptions {
  /**
   * The volume claim options.
   */
  volumeClaim?: Partial<k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>>

  /**
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>

  /**
   * The names of the users to create.
   * Their passwords will be generated and stored in a secret.
   */
  usernames: pulumi.Input<pulumi.Input<string>[]>
}

export interface Application extends k8s.Application {
  /**
   * The workload service that powers the application.
   */
  workloadService: k8s.WorkloadService<"StatefulSet">

  /**
   * The volume claim for the application data.
   */
  volumeClaim: k8s.raw.core.v1.PersistentVolumeClaim

  /**
   * The ingress which exposes the application.
   */
  ingress?: k8s.raw.networking.v1.Ingress
}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "radicale"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const volumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("data", fullName),
    namespace,

    realName: "data",

    ...options.volumeClaim,

    capacity: "400Mi",
  })

  const configMap = k8s.createConfigMap({
    name: k8s.getPrefixedName("config", fullName),
    namespace,

    realName: "config",

    key: "config",
    value: trimIndentation(`
      [server]
      hosts = 0.0.0.0:5232
      
      [auth]
      type = htpasswd
      htpasswd_filename = /config/users
      htpasswd_encryption = bcrypt
      
      [storage]
      filesystem_folder = /data/collections
    `),
  })

  const usersSecret = k8s.createSecret({
    name: k8s.getPrefixedName("users", fullName),
    namespace,

    realName: "users",

    key: "users",
    value: pulumi
      .output(options.usernames)
      .apply(usernames => {
        return pulumi.all(
          (usernames ?? []).map(username => {
            const password = random.createPassword({
              name: k8s.getPrefixedName(`user-${username}`, fullName),
              parent: namespace,

              length: 16,
            })

            k8s.createSecret({
              name: k8s.getPrefixedName(`user-${username}`, fullName),
              namespace,

              realName: `user-${username}`,

              data: {
                username,
                password: password.result,
              },
            })

            return pulumi.interpolate`${username}:${password.bcryptHash}`
          }),
        )
      })
      .apply(users => users.join("\n")),
  })

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "StatefulSet",
    realName: "radicale",

    container: {
      image: "tomsquest/docker-radicale:3.2.1.0",

      volumeMounts: [
        {
          name: volumeClaim.metadata.name,
          mountPath: "/data",
        },
        {
          name: "config",
          mountPath: "/config",
        },
      ],
    },

    port: 5232,

    volumes: [
      volumeClaim,
      {
        name: "config",
        projected: {
          sources: [
            {
              configMap: {
                name: configMap.metadata.name,
              },
            },
            {
              secret: {
                name: usersSecret.metadata.name,
              },
            },
          ],
        },
      },
    ],
  })

  const ingress =
    options.ingress &&
    k8s.createIngress({
      name: fullName,
      namespace,

      realName: "radicale",

      ...options.ingress,

      rules: [
        {
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: workloadService.service.metadata.name,
                    port: { number: workloadService.service.spec.ports[0].port },
                  },
                },
              },
            ],
          },
        },
      ],
    })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,
    ingress,
    volumeClaim,
    workloadService,
  }
}

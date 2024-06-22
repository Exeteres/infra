import { pulumi, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ApplicationOptions {
  /**
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>

  /**
   * The secret containing the database configuration.
   */
  databaseSecret: pulumi.Input<k8s.raw.core.v1.Secret>

  /**
   * The options to configure the service.
   */
  service?: k8s.ChildComponentOptions<k8s.ServiceOptions>

  /**
   * The options for init containers.
   */
  initContainers?: pulumi.Input<k8s.raw.types.input.core.v1.Container[]>

  /**
   * The options for extra volumes.
   */
  volumes?: pulumi.Input<k8s.raw.types.input.core.v1.Volume[]>

  /**
   * The value of the server token secret.
   * If not provided, the server token secret will be generated.
   */
  serverTokenSecret?: pulumi.Input<string>
}

export interface Application extends k8s.Application {
  /**
   * The ingress which exposes the application.
   */
  ingress?: k8s.raw.networking.v1.Ingress

  /**
   * The data volume claim.
   */
  dataVolumeClaim: k8s.raw.core.v1.PersistentVolumeClaim

  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"StatefulSet">
}

export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "attic"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const configSecret = k8s.createSecret({
    name: k8s.getPrefixedName("config", options.prefix),
    namespace,

    realName: "config",

    key: "config.json",
    value: pulumi.interpolate`  
      [database]
      url = "${pulumi.output(options.databaseSecret).stringData.url}"

      [storage]
      type = "local"
      path = "/data"

      [chunking]
      avg-size = 65536
      max-size = 262144
      min-size = 16384
      nar-size-threshold = 65536
    `.apply(trimIndentation),
  })

  const serverTokenSecret = k8s.createRandomSecret({
    name: k8s.getPrefixedName("server-token-secret", options.prefix),
    namespace,

    key: "secret",

    length: 64,
    format: "base64",

    existingValue: options.serverTokenSecret,
  })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("data", options.prefix),
    namespace,

    realName: "data",

    capacity: "1Gi",
  })

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "StatefulSet",

    annotations: options.annotations,
    labels: options.labels,

    nodeSelector: options.nodeSelector,
    service: options.service,
    initContainers: options.initContainers,

    port: 8080,

    container: {
      image: "ghcr.io/exeteres/attic:34l73mdkbl59fhrq0avgm7i9401jjv20",
      command: ["/bin/atticd", "--config", "/etc/attic/config.json"],

      volumeMounts: [
        {
          name: configSecret.metadata.name,
          mountPath: "/etc/attic",
        },
        {
          name: dataVolumeClaim.metadata.name,
          mountPath: "/data",
        },
      ],

      environment: {
        ATTIC_SERVER_TOKEN_HS256_SECRET_BASE64: {
          secretKeyRef: {
            name: serverTokenSecret.metadata.name,
            key: "secret",
          },
        },
      },
    },

    volumes: pulumi.output(options.volumes).apply(volumes => [
      ...(volumes ?? []),
      {
        name: configSecret.metadata.name,
        secret: {
          secretName: configSecret.metadata.name,
        },
      },
      {
        name: dataVolumeClaim.metadata.name,
        persistentVolumeClaim: {
          claimName: dataVolumeClaim.metadata.name,
        },
      },
    ]),
  })

  const ingress =
    options.ingress &&
    k8s.createIngress({
      name: fullName,
      namespace,

      ...options.ingress,

      rule: {
        ...options.ingress.rule,
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
    })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    workloadService,
    ingress,
    dataVolumeClaim,
  }
}

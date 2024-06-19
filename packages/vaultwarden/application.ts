import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ApplicationOptions {
  /**
   * The fully qualified domain name.
   */
  domain: pulumi.Input<string>

  /**
   * The options to configure the service.
   */
  service?: k8s.ChildComponentOptions<k8s.ServiceOptions>

  /**
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>

  /**
   * The options for init containers.
   */
  initContainers?: pulumi.Input<k8s.raw.types.input.core.v1.Container[]>

  /**
   * The options for extra volumes.
   */
  volumes?: pulumi.Input<k8s.raw.types.input.core.v1.Volume[]>

  /**
   * The secret containing the database configuration.
   */
  databaseSecret: pulumi.Input<k8s.raw.core.v1.Secret>
}

export interface Application extends k8s.Application {
  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"Deployment">

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
  const name = options.name ?? "vaultwarden"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "Deployment",

    annotations: options.annotations,
    labels: options.labels,

    nodeSelector: options.nodeSelector,
    service: options.service,
    initContainers: options.initContainers,

    port: 80,

    container: {
      image: "vaultwarden/server:1.30.5-alpine",

      environment: {
        DATABASE_URL: {
          secretKeyRef: {
            name: pulumi.output(options.databaseSecret).metadata.name,
            key: "url",
          },
        },
      },
    },

    volumes: options.volumes,
  })

  const ingress =
    options.ingress &&
    k8s.createIngress({
      name: fullName,
      namespace,

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
                    port: { number: 80 },
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

    workloadService,
    ingress,
  }
}

import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface VaultwardenOptions extends k8s.ApplicationOptions {
  /**
   * The fully qualified domain name.
   */
  domain: pulumi.Input<string>

  /**
   * The options to configure the service.
   */
  service?: k8s.ChildComponentOptions<k8s.ServiceOptions>

  /**
   * The options to configure the volume claim.
   */
  volumeClaim?: k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>

  /**
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>
}

export interface VaultwardenApplication extends k8s.Application {
  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"StatefulSet">

  /**
   * The volume claim which stores the application data.
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
export function createApplication(options: VaultwardenOptions): VaultwardenApplication {
  const name = options.name ?? "vaultwarden"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const volumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("data", fullName),
    namespace,

    ...options.volumeClaim,

    realName: "data",
    capacity: "200Mi",
  })

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "StatefulSet",

    annotations: options.annotations,
    labels: options.labels,

    nodeSelector: options.nodeSelector,
    service: options.service,

    port: 80,

    container: {
      image: "vaultwarden/server:1.30.5-alpine",

      volumeMounts: [
        {
          name: volumeClaim.metadata.name,
          mountPath: "/data",
        },
      ],
    },

    volume: volumeClaim,
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
    volumeClaim,
    ingress,
  }
}

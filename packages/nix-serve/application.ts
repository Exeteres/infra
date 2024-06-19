import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ApplicationOptions {
  /**
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>
}

export interface Application extends k8s.Application {
  /**
   * The workload service that powers the application.
   */
  workloadService: k8s.WorkloadService<"StatefulSet">

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
  const name = options.name ?? "nix-serve"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "StatefulSet",
    realName: "nix-serve",

    container: {
      image: "ghcr.io/exeteres/nix-serve:fcacbd1",
    },

    port: 5000,
  })

  const ingress =
    options.ingress &&
    k8s.createIngress({
      name: fullName,
      namespace,

      realName: "nix-serve",

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
    workloadService,
  }
}

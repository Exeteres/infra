import { merge } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions, gw.GatewayApplicationOptions {}
export interface Application extends k8s.ReleaseApplication, gw.GatewayApplication {}

/**
 * Creates a Helm release for the Kubernetes Dashboard.
 *
 * @param options The release options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions = {}): Application {
  const name = "kubernetes-dashboard"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const release = k8s.createHelmRelease({
    name,
    namespace,

    chart: "kubernetes-dashboard",
    repo: "https://kubernetes.github.io/dashboard",
    version: "7.5.0",

    ...options.release,

    values: merge(
      {
        kong: {
          proxy: {
            tls: {
              enabled: false,
            },
            http: {
              enabled: true,
            },
          },
        },
      },
      options.release?.values ?? {},
    ),
  })

  const gateway = gw.createApplicationRoutes(namespace, options.gateway, {
    httpRoute: {
      name,
      rule: {
        backend: {
          name: "kubernetes-dashboard-kong-proxy",
          port: 80,
        },
      },
    },
  })

  return {
    namespace,
    release,
    gateway,
  }
}

import { merge } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions, gw.RoutesApplicationOptions {}
export interface Application extends k8s.ReleaseApplication, gw.RoutesApplication {}

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

  const routes = gw.createApplicationRoutes(namespace, options.routes, {
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
    routes,
  }
}

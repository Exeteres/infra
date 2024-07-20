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
  const name = options.name ?? "kubernetes-dashboard"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    chart: "kubernetes-dashboard",
    repo: "https://kubernetes.github.io/dashboard",
    version: "7.4.0",

    ...options.releaseOptions,

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
      options.releaseOptions?.values ?? {},
    ),
  })

  const gateway = gw.createApplicationGateway(options.gateway, {
    name: fullName,
    namespace,

    httpRoute: {
      name: fullName,
      rule: {
        backendRef: {
          name: "kubernetes-dashboard-kong-proxy",
          port: 80,
        },
      },
    },
  })

  return {
    name,
    prefix: options.prefix,
    fullName,
    namespace,
    release,
    gateway,
  }
}

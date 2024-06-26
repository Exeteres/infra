import { merge } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {}
export interface Application extends k8s.ReleaseApplication {}

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
        app: {
          scheduling: {
            nodeSelector: options.nodeSelector,
          },
        },
        kong: {
          nodeSelector: options.nodeSelector,
        },
      },
      options.releaseOptions?.values ?? {},
    ),
  })

  return {
    name,
    prefix: options.prefix,
    fullName,
    namespace,
    release,
  }
}

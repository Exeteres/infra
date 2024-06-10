import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {}
export interface Application extends k8s.ReleaseApplication {}

/**
 * Creates a Helm release for the Kruise operator.
 *
 * @param options The release options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "kruise"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespaceName = `${fullName}-system`

  const namespace =
    options.namespace ??
    k8s.createNamespace({
      name: namespaceName,
      labels: {
        "app.kubernetes.io/managed-by": "Helm",
      },
      annotations: {
        "meta.helm.sh/release-name": name,
        "meta.helm.sh/release-namespace": namespaceName,
      },
    })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    chart: "kruise",
    repo: "https://openkruise.github.io/charts/",
    version: "1.6.3",

    ...options.releaseOptions,
  })

  return {
    name,
    prefix: options.prefix,
    namespace,
    fullName,
    release,
  }
}

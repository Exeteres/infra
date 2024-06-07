import { merge } from "@infra/core"
import { k8s } from "@infra/k8s"

/**
 * Creates a Helm release for Cert Manager.
 *
 * @param options The release options.
 * @returns The release.
 */
export function createApplication(options: k8s.ReleaseApplicationOptions = {}): k8s.ReleaseApplication {
  const name = options.name ?? "cert-manager"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    chart: "cert-manager",
    repo: "https://charts.jetstack.io",
    version: "1.14.5",

    ...options.releaseOptions,

    values: merge(
      {
        installCRDs: true,
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

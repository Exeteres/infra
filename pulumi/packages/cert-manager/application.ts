import { merge } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {}
export interface Application extends k8s.ReleaseApplication {}

/**
 * Creates a Helm release for Cert Manager.
 *
 * @param options The release options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions = {}): Application {
  const name = "cert-manager"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const release = k8s.createHelmRelease({
    name,
    namespace,

    chart: "cert-manager",
    repo: "https://charts.jetstack.io",
    version: "1.15.1",

    ...options.release,

    values: merge(
      {
        installCRDs: true,
      },
      options.release?.values ?? {},
    ),
  })

  return {
    namespace,
    release,
  }
}

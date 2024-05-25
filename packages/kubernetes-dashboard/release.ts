import { CommonOptions, HelmOptions, createHelmRelease } from "@infra/k8s"

/**
 * Creates a Helm release for the Kubernetes Dashboard.
 *
 * @param options The release options.
 * @returns The release.
 */
export function createKubernetesDashboardRelease(options: CommonOptions & Partial<HelmOptions>) {
  return createHelmRelease({
    chart: "kubernetes-dashboard",
    repo: "https://kubernetes.github.io/dashboard",
    version: "7.4.0",

    ...options,
  })
}

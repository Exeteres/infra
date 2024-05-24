import { HelmOptions, createHelmRelease } from "../kubernetes"
import { CommonOptions } from "../shared"

/**
 * Creates a Helm release for Cert Manager.
 *
 * @param options The release options.
 * @returns The release.
 */
export function createCertManagerRelease(options: CommonOptions & Partial<HelmOptions>) {
  return createHelmRelease({
    chart: "cert-manager",
    repo: "https://charts.jetstack.io",
    version: "1.14.5",

    ...options,

    values: {
      installCRDs: true,

      ...options.values,
    },
  })
}

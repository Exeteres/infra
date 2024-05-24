import { HelmOptions, createHelmRelease } from "../kubernetes"
import { CommonOptions } from "../shared"

/**
 * Creates a Helm release for the Kruise operator.
 *
 * @param options The release options.
 * @returns The release.
 */
export function createKruiseRelease(options: CommonOptions & Partial<HelmOptions>) {
  return createHelmRelease({
    chart: "kruise",
    repo: "https://openkruise.github.io/charts/",
    version: "1.6.3",

    ...options,
  })
}

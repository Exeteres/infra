import { pulumi } from "@infra/core"
import { CommonOptions, mapPulumiOptions } from "./options"
import { k8s } from "./imports"

export interface HelmOptions extends CommonOptions {
  /**
   * The URL of the Helm repository.
   */
  repo: string

  /**
   * The name of the Helm chart in the repository.
   */
  chart: string

  /**
   * The version of the Helm chart.
   */
  version: string

  /**
   * The values to pass to the Helm chart.
   */
  values?: pulumi.Input<Record<string, unknown>>

  /**
   * Whether to skip waiting for the Helm chart to be ready.
   */
  skipAwait?: boolean
}

/**
 * Creates a Helm chart.
 * All resources of the chart will be created and managed by Pulumi.
 *
 * @param options The options to create a Helm chart.
 * @returns The created Helm chart.
 */
export function createHelmChart(options: HelmOptions) {
  return new k8s.helm.v3.Chart(
    options.name,
    {
      namespace: options.namespace.metadata.name,
      fetchOpts: { repo: options.repo },
      version: options.version,
      chart: options.chart,
      values: options.values,
      skipAwait: options.skipAwait,
    },
    mapPulumiOptions(options),
  )
}

/**
 * Creates a Helm release.
 * All resources of the release will be created and managed by Helm Controller and
 * will be completely opaque to Pulumi.
 *
 * @param options The options to create a Helm release.
 * @returns The created Helm release.
 */
export function createHelmRelease(options: HelmOptions) {
  return new k8s.helm.v3.Release(
    options.name,
    {
      name: options.name,
      namespace: options.namespace.metadata.name,
      repositoryOpts: { repo: options.repo },
      version: options.version,
      chart: options.chart,
      values: options.values,
      skipAwait: options.skipAwait,
    },
    mapPulumiOptions(options),
  )
}

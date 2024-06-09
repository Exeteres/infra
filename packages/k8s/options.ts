import { resource, pulumi, PartialKeys } from "@infra/core"
import { raw } from "./imports"
import { HelmOptions } from "./helm"

export interface CommonOptions extends resource.CommonOptions {
  /**
   * The namespace to deploy the resource into.
   */
  namespace: raw.core.v1.Namespace

  /**
   * The labels to apply to the resource.
   */
  labels?: pulumi.Input<Record<string, string>>

  /**
   * The annotations to apply to the resource.
   */
  annotations?: pulumi.Input<Record<string, string>>

  /**
   * The real name of the resource which will be used as the name of the resource in the Kubernetes API.
   * By default, the name of the resource is used.
   */
  realName?: string
}

export type ScopedOptions = Omit<CommonOptions, "namespace"> &
  (
    | {
        /**
         * Whether the resource is cluster-scoped or namespace-scoped.
         * By default, resources are namespace-scoped.
         */
        isClusterScoped: true
      }
    | {
        /**
         * The namespace to deploy the resource into.
         */
        namespace: raw.core.v1.Namespace

        /**
         * Whether the resource is cluster-scoped or namespace-scoped.
         * By default, resources are namespace-scoped.
         */
        isClusterScoped?: false
      }
  )

/**
 * Maps options to Kubernetes metadata.
 *
 * @param options The options to map.
 * @param extra Additional metadata to include.
 * @returns The mapped metadata.
 */
export function mapMetadata<TOptions extends Partial<CommonOptions>>(
  options: TOptions,
  extra?: pulumi.Input<raw.types.input.meta.v1.ObjectMeta>,
): pulumi.Input<raw.types.input.meta.v1.ObjectMeta> {
  return pulumi.all([options.labels, options.annotations, extra]).apply(([labels, annotations, extra]) => {
    return {
      name: options.realName ?? options.name,
      namespace: options.namespace?.metadata.name,
      labels,
      annotations,
      ...extra,
    }
  })
}

export type NodeSelector = pulumi.Input<Record<string, pulumi.Input<string>>>

/**
 * Maps a hostname to a node selector.
 *
 * @param hostname The hostname to map.
 * @returns The node selector.
 */
export function mapHostnameToNodeSelector(hostname: string): NodeSelector {
  return {
    "kubernetes.io/hostname": hostname,
  }
}

export function mapPulumiOptions(
  options: Partial<CommonOptions>,
  extra?: pulumi.CustomResourceOptions,
): pulumi.CustomResourceOptions {
  const baseOptions = resource.mapPulumiOptions(options)

  return {
    ...resource.mapPulumiOptions(options),
    parent: baseOptions.parent ?? options.namespace,
    ...extra,
  }
}

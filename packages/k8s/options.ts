import { PartialKeys, pulumi } from "@infra/core"
import { k8s } from "./imports"

export interface CommonOptions {
  /**
   * The logical name of the resource.
   */
  name: string

  /**
   * The namespace to deploy the resource into.
   */
  namespace: k8s.core.v1.Namespace

  /**
   * The labels to apply to the resource.
   */
  labels?: pulumi.Input<Record<string, string>>

  /**
   * The annotations to apply to the resource.
   */
  annotations?: pulumi.Input<Record<string, string>>

  /**
   * The resources that this resource depends on.
   */
  dependsOn?: pulumi.Input<pulumi.Resource>[] | pulumi.Input<pulumi.Resource>
}

export interface ClusteredOptions extends CommonOptions {
  /**
   * Whether the resource is cluster-scoped or namespace-scoped.
   * By default, resources are namespace-scoped.
   */
  isClusterScoped?: boolean
}

export type ClusterScoped<TOptions extends ClusteredOptions> = Omit<TOptions, "namespace"> & { isClusterScoped: true }
export type NamespaceScoped<TOptions extends ClusteredOptions> = TOptions & { isClusterScoped?: false }

export function mapMetadata<TOptions extends Partial<CommonOptions>>(
  options: TOptions,
  extra?: pulumi.Input<k8s.types.input.meta.v1.ObjectMeta>,
): pulumi.Input<k8s.types.input.meta.v1.ObjectMeta> {
  return pulumi.all([options.labels, options.annotations, extra]).apply(([labels, annotations, extra]) => {
    return {
      namespace: options.namespace?.metadata.name,
      labels,
      annotations,
      ...extra,
    }
  })
}

export function mapPulumiOptions<TOptions extends Partial<CommonOptions>>(
  options: TOptions,
  extra?: pulumi.CustomResourceOptions,
): pulumi.CustomResourceOptions {
  return {
    parent: options.namespace,
    dependsOn: options.dependsOn,
    ...extra,
  }
}

export type NodeSelectorInput = pulumi.Input<Record<string, pulumi.Input<string>>>

export interface CommonAppOptions extends PartialKeys<CommonOptions, "name"> {
  /**
   * The node selector to deploy the application.
   * All components will be deployed to the same node unless specified otherwise.
   */
  nodeSelector?: NodeSelectorInput
}

/**
 * Maps a hostname to a node selector.
 *
 * @param hostname The hostname to map.
 * @returns The node selector.
 */
export function mapHostnameToNodeSelector(hostname: string): NodeSelectorInput {
  return {
    "kubernetes.io/hostname": hostname,
  }
}

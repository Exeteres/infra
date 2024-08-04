import { CustomResourceOptions } from "@pulumi/pulumi"
import { pulumi } from "./imports"

export interface CommonOptions {
  /**
   * The name of the resource.
   * Must be unique for the given type in the given stack.
   */
  name: string

  /**
   * The parent resource.
   */
  parent?: pulumi.Resource

  /**
   * The provider to use for the resource.
   */
  provider?: pulumi.ProviderResource

  /**
   * The dependencies of the resource.
   */
  dependsOn?: pulumi.Input<pulumi.Input<pulumi.Resource>[]> | pulumi.Input<pulumi.Resource>

  /**
   * The Pulumi resource options.
   */
  resourceOptions?: CustomResourceOptions
}

/**
 * Maps the given options to Pulumi options for a resource.
 *
 * @param options The options.
 * @param extra Additional options to add.
 * @returns The Pulumi options.
 */
export function mapPulumiOptions<TOptions extends Partial<CommonOptions>>(
  options: TOptions,
  extra?: pulumi.CustomResourceOptions,
): pulumi.CustomResourceOptions {
  return {
    parent: options.parent,
    dependsOn: options.dependsOn,
    provider: options.provider,
    ...options.resourceOptions,
    ...extra,
  }
}

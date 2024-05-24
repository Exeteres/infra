import { pulumi, pulumiRandom } from "./imports"
import { CommonOptions } from "./options"

/**
 * Transforms a pair of input options (single and multiple) into a single array input.
 */
export function normalizeInputArray<T>(
  single: pulumi.Input<T> | undefined,
  multiple: pulumi.Input<T[]> | undefined,
): pulumi.Input<T[]> | undefined {
  if (!single) {
    return multiple
  }

  if (!multiple) {
    return pulumi.all([single]).apply(([single]) => [single]) as pulumi.Input<T[]>
  }

  return pulumi
    .all([single, multiple]) //
    .apply(([single, multiple]) => [single, ...multiple]) as pulumi.Input<T[]>
}

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

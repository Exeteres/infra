import { pulumi } from "./imports"

/**
 * Transforms a pair of input options (single and multiple) into a single array input.
 */
export function normalizeInputArray<T>(
  single: pulumi.Input<T> | undefined,
  multiple: pulumi.Input<pulumi.Input<T>[]> | undefined,
): pulumi.Input<pulumi.Input<T>[]> {
  if (single) {
    return [single]
  }

  if (multiple) {
    return multiple
  }

  return []
}

export function normalizeInputArrayAndMap<T, U>(
  single: pulumi.Input<T> | undefined,
  multiple: pulumi.Input<pulumi.Input<T>[]> | undefined,
  mapFn: (value: T) => pulumi.Input<U>,
): pulumi.Input<pulumi.Input<U>[]> {
  if (single) {
    return [pulumi.output(single).apply(mapFn as any)]
  }

  if (multiple) {
    return pulumi.output(multiple).apply(values => values.map(mapFn as any)) as any
  }

  return []
}

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

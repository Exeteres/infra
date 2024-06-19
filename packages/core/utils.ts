import { pulumi } from "./imports"

/**
 * Transforms a pair of input options (single and multiple) into a single array input.
 *
 * @param single The single input value.
 * @param multiple The multiple input value.
 * @returns The normalized input array.
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

/**
 * Transforms a pair of input options (single and multiple) into a single array input and maps the values.
 *
 * @param single The single input value.
 * @param multiple The multiple input value.
 * @param mapFn The mapping function.
 * @returns The normalized input array.
 */
export function normalizeInputArrayAndMap<T, U>(
  single: pulumi.Input<T> | undefined,
  multiple: pulumi.Input<pulumi.Input<T>[]> | undefined,
  mapFn: (value: T) => pulumi.Input<U>,
): pulumi.Input<pulumi.Input<U>[]> {
  if (single && multiple) {
    return pulumi
      .all([single, multiple])
      .apply(([singleValue, multipleValues]) => [mapFn(singleValue as T), ...multipleValues.map(mapFn as any)]) as any
  }

  if (single) {
    if (pulumi.Output.isInstance(single)) {
      return pulumi.output(single).apply(v => [mapFn(v as T)])
    }

    return [mapFn(single as T) as any]
  }

  if (multiple) {
    return pulumi.output(multiple).apply(values => values.map(mapFn as any)) as any
  }

  return []
}

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Removes the indentation from a multiline string.
 *
 * @param str The string to trim.
 * @returns The trimmed string.
 */
export function trimIndentation(str: string): string {
  const lines = str.split("\n")
  const indent = lines
    .filter(line => line.trim() !== "")
    .map(line => line.match(/^\s*/)?.[0].length ?? 0)
    .reduce((min, indent) => Math.min(min, indent), Infinity)

  return lines
    .map(line => line.slice(indent))
    .join("\n")
    .trim()
}

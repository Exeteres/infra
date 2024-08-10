import { pulumi } from "./imports"
import { Input } from "@pulumi/pulumi"

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
  if (single && multiple) {
    return pulumi
      .all([single, multiple])
      .apply(([singleValue, multipleValues]) => [singleValue, ...multipleValues]) as any
  }

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

export function undefinedIfEmpty<T>(value: pulumi.Input<T[]>): pulumi.Output<T[] | undefined> {
  return pulumi.output(value).apply(v => (v.length > 0 ? v : undefined)) as any
}

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

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

export function mergeInputArrays<T>(...arrays: (pulumi.Input<T[]> | undefined | null)[]): pulumi.Output<T[]> {
  return pulumi.all(arrays).apply(arrays => arrays.filter(Boolean).flat()) as any
}

export function appendToInputArray<T>(
  array: pulumi.Input<T[]> | undefined,
  value: pulumi.Input<T>,
): pulumi.Output<T[]> {
  return mergeInputArrays<T>(array, [value as any])
}

export type InputArray<T> = pulumi.Input<pulumi.Input<T>[]>

export type HasFields = Record<string, any>

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P]
}

export { Input }

export function mapOptional<T, U>(mapFn: (value: T) => U, value: T | undefined): U | undefined {
  return value ? mapFn(value) : undefined
}

export function mapOptionalInput<T, U>(
  mapFn: (value: T) => U,
  value: pulumi.Input<T | undefined> | undefined,
  defaultValue?: T,
): pulumi.Output<U | undefined> {
  return pulumi.output(value).apply(v => mapOptional(mapFn, v as T | undefined) ?? mapOptional(mapFn, defaultValue))
}

export function mergeInputObjects<T extends HasFields>(
  ...objects: (pulumi.Input<T> | undefined | null)[]
): pulumi.Output<T> {
  return pulumi.all(objects).apply(objects => {
    const result: T = {} as T
    for (const obj of objects.filter(Boolean) as T[]) {
      Object.assign(result, obj)
    }
    return result
  }) as any
}

export function mapObjectKeys<T extends HasFields>(mapFn: (key: string) => string, obj: T): Record<string, T[keyof T]> {
  const result: Record<string, T[keyof T]> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[mapFn(key)] = value
  }
  return result
}

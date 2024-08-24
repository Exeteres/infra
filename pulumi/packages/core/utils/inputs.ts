import { all, Input, output, Output, Unwrap } from "@pulumi/pulumi"
import { InputArray } from "./shared"

/**
 * Transforms a pair of input options (single and multiple) into flat array output.
 *
 * @param single The single input value.
 * @param multiple The multiple input value.
 * @returns The normalized array output.
 */
export function normalizeInputs<T>(
  single: Input<T> | undefined,
  multiple: InputArray<T> | undefined,
): Output<Unwrap<T>[]> {
  if (single && multiple) {
    return all([single, multiple]).apply(([singleValue, multipleValues]) => {
      return [singleValue, ...multipleValues] as Unwrap<T>[]
    })
  }

  if (single) {
    return output(single).apply(v => [v])
  }

  if (multiple) {
    return output(multiple).apply(v => v as Unwrap<T>[])
  }

  return output([])
}

/**
 * Maps each element of an input array to a new value.
 * Produces an output array with the same length.
 *
 * @param array The input array.
 * @param fn The mapping function.
 * @returns The output array.
 */
export function mapInputs<T, U>(
  array: InputArray<T>,
  fn: (v: Unwrap<T>, index: number, all: Unwrap<T>[]) => U,
): Output<U[]> {
  return output(array).apply(array => array.map((v, index) => fn(v as Unwrap<T>, index, array as Unwrap<T>[])))
}

/**
 * Normalizes a pair of input options (single and multiple) into flat array output,
 * and maps each element of the array to a new value.
 *
 * @param single The single input value.
 * @param multiple The multiple input value.
 * @param fn The mapping function.
 * @returns The normalized and mapped array output.
 */
export function normalizeInputsAndMap<T, U>(
  single: Input<T> | undefined,
  multiple: InputArray<T> | undefined,
  fn: (v: Unwrap<T>, index: number, all: Unwrap<T>[]) => U,
): Output<U[]> {
  return mapInputs(normalizeInputs(single, multiple) as InputArray<T>, fn)
}

/**
 * Maps an optional input value to a new value.
 *
 * @param input The input value.
 * @param fn The mapping function.
 * @returns The output value.
 */
export function mapOptionalInput<T, U>(
  input: Input<T> | undefined,
  fn: (v: Unwrap<T>) => U,
  defaultValue?: T,
): Output<U> | undefined {
  if (input) {
    return output(input).apply(v => fn(v as Unwrap<T>))
  }

  return defaultValue ? output(defaultValue).apply(v => fn(v as Unwrap<T>)) : undefined
}

/**
 * Maps each element of an optional input array to a new value.
 * Produces an output array with the same length.
 *
 * @param array The input array.
 * @param fn The mapping function.
 * @returns The output array.
 */
export function mapOptionalInputs<T, U>(
  input: InputArray<T> | undefined,
  fn: (v: Unwrap<T>) => U,
): Output<U[]> | undefined {
  if (input) {
    return output(input).apply(array => array.map(v => fn(v as Unwrap<T>)))
  }

  return undefined
}

export function mergeInputArrays<T>(...arrays: (InputArray<T> | undefined | null)[]): Output<T[]> {
  return all(arrays).apply(arrays => arrays.filter(Boolean).flat()) as any
}

export function flattenInputs<T>(array: InputArray<InputArray<T>>): Output<T[]> {
  return output(array).apply(array => array.flat()) as any
}

export function appendToInputArray<T>(array: Input<T[]> | undefined, value?: Input<T | undefined>): Output<T[]> {
  return mergeInputArrays<T>(
    array,
    output(value).apply(v => (v ? [v as T] : [])),
  )
}

export type HasFields = Record<string, any>

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P]
}

export function mergeInputObjects<T extends HasFields>(...objects: (Input<T> | undefined | null)[]): Output<T> {
  return all(objects).apply(objects => {
    const result: T = {} as T
    for (const obj of objects.filter(Boolean) as T[]) {
      Object.assign(result, obj)
    }
    return result
  }) as any
}

import { output, Input, Output, Unwrap, all } from "@pulumi/pulumi"

// Shortcuts for common Pulumi types and functions
export { Input, Output, Unwrap }
export { output, all }

// Shortcuts for helper functions from other libraries
export { merge } from "ts-deepmerge"
export { pipe, apply } from "fp-ts/lib/function"

// Obvious type aliases
export type InputArray<T> = Input<Input<T>[]>

/**
 * Map an optional value to another optional value.
 *
 * @param input The input value.
 * @param func The function to apply to the input value.
 * @returns The output value, or `undefined` if the input value is `undefined`.
 */
export function mapOptional<T, U>(input: T | undefined, func: (value: T) => U): U | undefined {
  if (input === undefined) {
    return undefined
  }

  return func(input)
}

import * as raw from "@pulumi/random"
import { CommonOptions, mapPulumiOptions } from "./resource"

export { raw }

export interface RandomOptions extends CommonOptions {
  /**
   * The length of the secret.
   */
  length: number
}

/**
 * Creates a random bytes of the specified length.
 */
export function createRandomBytes(options: RandomOptions) {
  return new raw.RandomBytes(
    options.name,
    {
      length: options.length,
    },
    mapPulumiOptions(options),
  )
}

/**
 * Creates a random password of the specified length.
 */
export function createPassword(options: RandomOptions) {
  return new raw.RandomPassword(
    options.name,
    {
      length: options.length,
    },
    mapPulumiOptions(options),
  )
}

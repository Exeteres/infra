import { createSecret } from "./secret"
import { CommonOptions, mapPulumiOptions } from "./options"
import { random } from "@infra/core"

interface RandomSecretOptions extends CommonOptions {
  /**
   * The key of the secret.
   */
  key: string

  /**
   * The length of the secret.
   */
  length: number
}

/**
 * Creates a secret with a random value.
 *
 * @param options The options to create the secret.
 * @returns The secret.
 */
export function createRandomSecret(options: RandomSecretOptions) {
  const randomValue = new random.raw.RandomBytes(
    options.name,
    {
      length: options.length,
    },
    mapPulumiOptions(options),
  )

  return createSecret({ ...options, value: randomValue.hex })
}

/**
 * Creates a secret with a random password.
 *
 * @param options The options to create the secret.
 * @returns The secret.
 */
export function createPasswordSecret(options: RandomSecretOptions) {
  const randomPassword = new random.raw.RandomPassword(
    options.name,
    {
      length: options.length,
    },
    mapPulumiOptions(options),
  )

  return createSecret({ ...options, value: randomPassword.result })
}

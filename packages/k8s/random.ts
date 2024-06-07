import { pulumiRandom } from "@infra/core"
import { createSecret } from "./secret"
import { CommonOptions, mapPulumiOptions } from "./options"

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
  const randomValue = new pulumiRandom.RandomBytes(
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
  const randomPassword = new pulumiRandom.RandomPassword(
    options.name,
    {
      length: options.length,
    },
    mapPulumiOptions(options),
  )

  return createSecret({ ...options, value: randomPassword.result })
}

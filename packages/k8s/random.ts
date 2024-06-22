import { createSecret } from "./secret"
import { CommonOptions, mapPulumiOptions } from "./options"
import { pulumi, random } from "@infra/core"

interface RandomSecretOptions extends CommonOptions {
  /**
   * The key of the secret.
   */
  key: string

  /**
   * The length of the secret.
   */
  length: number

  /**
   * The predefined value of the secret.
   * If provided, the secret will be created with this value and no random value will be generated.
   */
  existingValue?: pulumi.Input<string>
}

/**
 * Creates a secret with a random value.
 *
 * @param options The options to create the secret.
 * @returns The secret.
 */
export function createRandomSecret(options: RandomSecretOptions) {
  const randomValue =
    options.existingValue ??
    new random.raw.RandomBytes(
      options.name,
      {
        length: options.length,
      },
      mapPulumiOptions(options),
    ).hex

  return createSecret({ ...options, value: randomValue })
}

/**
 * Creates a secret with a random password.
 *
 * @param options The options to create the secret.
 * @returns The secret.
 */
export function createPasswordSecret(options: RandomSecretOptions) {
  const randomValue =
    options.existingValue ??
    new random.raw.RandomPassword(
      options.name,
      {
        length: options.length,
      },
      mapPulumiOptions(options),
    ).result

  return createSecret({ ...options, value: randomValue })
}

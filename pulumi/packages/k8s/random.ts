import { createSecret } from "./secret"
import { CommonOptions, mapPulumiOptions } from "./options"
import { Input, random } from "@infra/core"

interface PasswordSecretOptions extends CommonOptions {
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
  existingValue?: Input<string>
}

interface RandomSecretOptions extends PasswordSecretOptions {
  /**
   * The format to use for the secret value.
   * By default, the value will be formatted as a hex string.
   */
  format?: "hex" | "base64"
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
    )[options.format ?? "hex"]

  return createSecret({ ...options, value: randomValue })
}

/**
 * Creates a secret with a random password.
 *
 * @param options The options to create the secret.
 * @returns The secret.
 */
export function createPasswordSecret(options: PasswordSecretOptions) {
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

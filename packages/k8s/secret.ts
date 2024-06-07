import { pulumi } from "@infra/core"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { raw } from "./imports"

type SecretOptions = CommonOptions & {
  /**
   * The type of the secret.
   */
  type?: string
} & (
    | {
        /**
         * The key of the secret.
         * By default, the key is `value`.
         */
        key: string

        /**
         * The value of the secret.
         */
        value: pulumi.Input<string>
      }
    | {
        /**
         * The arbitrary data of the secret which can be used instead of `key` and `value`.
         */
        data: Record<string, pulumi.Input<string>>
      }
  )

/**
 * Create a new secret with the given options.
 *
 * @param options The options for the secret.
 * @returns The created secret.
 */
export function createSecret(options: SecretOptions) {
  return new raw.core.v1.Secret(
    options.name,
    {
      metadata: mapMetadata(options),
      type: options.type,
      stringData: "value" in options ? { [options.key]: options.value } : options.data,
    },
    mapPulumiOptions(options),
  )
}

/**
 * Maps a secret resource to a ref object: { name, key }.
 *
 * @param secret The secret resource.
 * @returns The ref object: { name, key }.
 */
export function mapSecretToRef(secret: raw.core.v1.Secret, key?: string) {
  return {
    name: secret.metadata.name,
    key,
  }
}

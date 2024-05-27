import { pulumi } from "@infra/core"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { k8s } from "./imports"

interface SecretOptions extends CommonOptions {
  /**
   * The key of the secret.
   * By default, the key is `value`.
   */
  key?: string

  /**
   * The type of the secret.
   */
  type?: string

  /**
   * The value of the secret.
   */
  value?: pulumi.Input<string>

  /**
   * The arbitrary data of the secret which can be used instead of `key` and `value`.
   */
  data?: Record<string, pulumi.Input<string>>
}

/**
 * Create a new secret with the given options.
 *
 * @param options The options for the secret.
 * @returns The created secret.
 */
export function createSecret(options: SecretOptions) {
  return new k8s.core.v1.Secret(
    options.name,
    {
      metadata: mapMetadata(options),
      type: options.type,
      stringData: options.value ? { [options.key ?? "value"]: options.value! } : options.data,
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
export function mapSecretToRef(secret: k8s.core.v1.Secret) {
  return {
    name: secret.metadata.name,
    key: secret.stringData.apply(d => Object.keys(d ?? {})[0]),
  }
}

import { raw } from "./imports"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { pulumi } from "@infra/core"

type ConfigMapOptions = CommonOptions &
  (
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
 * Create a new config map with the given options.
 *
 * @param options The options for the config map.
 * @returns The created config map.
 */
export function createConfigMap(options: ConfigMapOptions) {
  return new raw.core.v1.ConfigMap(
    options.name,
    {
      metadata: mapMetadata(options),
      data: "value" in options ? { [options.key]: options.value } : options.data,
    },
    mapPulumiOptions(options),
  )
}

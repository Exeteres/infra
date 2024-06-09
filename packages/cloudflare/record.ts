import { pulumi, resource } from "@infra/core"
import { CommonOptions } from "./options"
import { raw } from "./imports"

export interface RecordOptions extends CommonOptions {
  /**
   * The type of DNS record.
   */
  type: pulumi.Input<string>

  /**
   * The value of the DNS record.
   */
  value: pulumi.Input<string>

  /**
   * The TTL of the DNS record.
   */
  ttl?: pulumi.Input<number>
}

/**
 * Create a new DNS record.
 *
 * @param options The options for the DNS record.
 * @returns The DNS record.
 */
export function createRecord(options: RecordOptions) {
  return new raw.Record(
    options.name,
    {
      name: options.name,
      zoneId: options.zoneId,
      type: options.type,
      value: options.value,
      ttl: options.ttl,
    },
    resource.mapPulumiOptions(options),
  )
}

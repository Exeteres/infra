import { Input, resource } from "@infra/core"
import { CommonOptions } from "./options"
import { raw } from "./imports"

export interface RecordOptions extends CommonOptions {
  /**
   * The name of the DNS record.
   * If not provided, the "name" will be used.
   * Note that in DNS, multiple records can have the same name (and even the same type).
   */
  recordName?: Input<string>

  /**
   * The type of DNS record.
   */
  type: Input<string>

  /**
   * The value of the DNS record.
   */
  value: Input<string>

  /**
   * The TTL of the DNS record.
   */
  ttl?: Input<number>

  /**
   * The priority of the DNS record.
   */
  priority?: Input<number>

  /**
   * Whether the DNS record is proxied through Cloudflare.
   */
  proxied?: Input<boolean>
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
      name: options.recordName ?? options.name,
      allowOverwrite: true,
      comment: "Managed by Pulumi",
      zoneId: options.zoneId,
      type: options.type,
      value: options.value,
      ttl: options.ttl,
      priority: options.priority,
      proxied: options.proxied ?? false,
    },
    resource.mapPulumiOptions(options),
  )
}

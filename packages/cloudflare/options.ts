import { pulumi, resource } from "@infra/core"

export interface CommonOptions extends resource.CommonOptions {
  /**
   * The zone ID of the Cloudflare zone.
   */
  zoneId: pulumi.Input<string>
}

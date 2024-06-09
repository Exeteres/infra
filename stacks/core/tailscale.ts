import { pulumi } from "@infra/core"
import { tailscale } from "@infra/tailscale"

const config = new pulumi.Config("tailscale")

tailscale.createApplication({
  clientId: config.require("client-id"),
  clientSecret: config.require("client-secret"),
})

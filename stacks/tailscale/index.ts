import { pulumi } from "@infra/core"
import { tailscale } from "@infra/tailscale"

const config = new pulumi.Config("tailscale")

tailscale.createApplication({
  clientId: config.require("clientId"),
  clientSecret: config.require("clientSecret"),
})

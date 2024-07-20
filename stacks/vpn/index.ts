import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { tailscale } from "@infra/tailscale"
import { vpn } from "@infra/vpn"

const config = new pulumi.Config("vpn")

const address = config.require("address")
const dnsServerAddress = config.require("dnsServerAddress")
const locations = config.getObject<vpn.LocationConfig[]>("locations") ?? []
const privateKey = config.requireSecret("privateKey")
const tailscaleAuthKey = config.requireSecret("tailscaleAuthKey")

const namespace = k8s.createNamespace({ name: "vpn" })

tailscale.createAuthSecret({
  name: "vpn-tailscale-auth",
  namespace,
  value: tailscaleAuthKey,
})

for (const location of locations) {
  vpn.createTailscaleDeployment({
    namespace,
    address,
    dnsServerAddress,
    privateKey,
    location,
  })
}

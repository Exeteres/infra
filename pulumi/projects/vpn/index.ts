import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { vpn } from "@infra/vpn"

interface LocationConfig extends vpn.LocationConfig {
  authStateSecret?: string
}

const config = new pulumi.Config("vpn")

const address = config.require("address")
const dnsServerAddress = config.require("dnsServerAddress")
const locations = config.getObject<LocationConfig[]>("locations") ?? []
const privateKey = config.requireSecret("privateKey")
const tailscaleAuthKey = config.requireSecret("tailscaleAuthKey")

const namespace = k8s.createNamespace({ name: "vpn" })

for (const location of locations) {
  const authState = location.authStateSecret ? config.requireSecret(location.authStateSecret) : undefined

  vpn.createTailscaleDeployment({
    namespace,
    address,
    dnsServerAddress,
    privateKey,
    location,
    authKey: tailscaleAuthKey,
    authState,
  })
}

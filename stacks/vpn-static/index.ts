import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { vpn } from "@infra/vpn"

interface StaticLocationConfig extends vpn.LocationConfig {
  port: number
}

const config = new pulumi.Config("vpn-static")

const address = config.require("address")
const frontendAddress = config.require("frontendAddress")
const dnsServerAddress = config.require("dnsServerAddress")
const locations = config.getObject<StaticLocationConfig[]>("locations") ?? []
const privateKey = config.requireSecret("privateKey")
const frontendPrivateKey = config.requireSecret("frontendPrivateKey")
const clients = config.getObject<vpn.StaticClientConfig[]>("clients") ?? []

const namespace = k8s.createNamespace({ name: "vpn-static" })

for (const location of locations) {
  vpn.createStaticDeployment({
    namespace,
    frontendAddress,
    address,
    dnsServerAddress,
    privateKey,
    location,
    frontendPort: location.port,
    frontendPrivateKey,
    clients,
  })
}

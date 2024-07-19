import { pulumi } from "@infra/core"
import { resolveStack } from "./stack"
import { cloudflare } from "@infra/cloudflare"
import { k8s } from "@infra/k8s"
import { getSharedStack, singleton } from "./utils"

export const getCloudflareProvider = singleton(() => {
  const sharedStack = getSharedStack()
  const cloudflareApiToken = sharedStack.requireOutput("cloudflareApiToken")

  return new cloudflare.raw.Provider("cloudflare", { apiToken: cloudflareApiToken })
})

function createDnsRecord(namespace: k8s.raw.core.v1.Namespace, domain: string, ip: pulumi.Input<string>) {
  const sharedStack = getSharedStack()
  const provider = getCloudflareProvider()
  const cloudflareZoneId = sharedStack.requireOutput("cloudflareZoneId")

  return cloudflare.createRecord({
    name: domain,
    type: "A",
    value: ip,
    zoneId: cloudflareZoneId,

    parent: namespace,
    provider: provider,
  })
}

export function createPublicDnsRecord(namespace: k8s.raw.core.v1.Namespace, domain: string) {
  const sharedStack = getSharedStack()
  const nodeIpAddress = sharedStack.requireOutput("nodeIpAddress")

  return createDnsRecord(namespace, domain, nodeIpAddress)
}

export function createInternalDnsRecord(namespace: k8s.raw.core.v1.Namespace, domain: string) {
  const internalGatewayStack = resolveStack("internal-gateway")
  const gatewayIp = internalGatewayStack.requireOutput("gatewayIp")

  return createDnsRecord(namespace, domain, gatewayIp)
}

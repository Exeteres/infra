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

export function createDnsRecord(
  namespace: k8s.raw.core.v1.Namespace,
  options: Omit<cloudflare.RecordOptions, "parent" | "zoneId" | "provider">,
) {
  const sharedStack = getSharedStack()
  const provider = getCloudflareProvider()
  const cloudflareZoneId = sharedStack.requireOutput("cloudflareZoneId")

  return cloudflare.createRecord({
    zoneId: cloudflareZoneId,

    parent: namespace,
    provider: provider,
    ...options,
  })
}

export function createPublicDnsRecord(namespace: k8s.raw.core.v1.Namespace, domain: string) {
  const sharedStack = getSharedStack()
  const nodeIpAddress = sharedStack.requireOutput("nodeIpAddress")

  return createDnsRecord(namespace, { name: domain, type: "A", value: nodeIpAddress })
}

export function createInternalDnsRecord(namespace: k8s.raw.core.v1.Namespace, domain: string) {
  const internalGatewayStack = resolveStack("internal-gateway")
  const gatewayIp = internalGatewayStack.requireOutput("gatewayIp")

  return createDnsRecord(namespace, { name: domain, type: "A", value: gatewayIp })
}

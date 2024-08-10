import { getSharedEnvironment, resolveStack } from "./stack"
import { cloudflare } from "@infra/cloudflare"
import { k8s } from "@infra/k8s"
import { singleton } from "./utils"

export const getCloudflareProvider = singleton(() => {
  const { cloudflareApiToken } = getSharedEnvironment()

  return new cloudflare.raw.Provider("cloudflare", { apiToken: cloudflareApiToken })
})

export function createDnsRecord(
  namespace: k8s.raw.core.v1.Namespace,
  options: Omit<cloudflare.RecordOptions, "parent" | "zoneId" | "provider">,
) {
  const { cloudflareZoneId } = getSharedEnvironment()
  const provider = getCloudflareProvider()

  return cloudflare.createRecord({
    zoneId: cloudflareZoneId,

    parent: namespace,
    provider: provider,
    ...options,
  })
}

export function createPublicDnsRecord(namespace: k8s.raw.core.v1.Namespace, domain: string) {
  const { publicIp } = getSharedEnvironment()

  return createDnsRecord(namespace, {
    name: domain,
    type: "A",
    value: publicIp,
  })
}

export function createInternalDnsRecord(namespace: k8s.raw.core.v1.Namespace, domain: string) {
  const internalGatewayStack = resolveStack("internal-gateway")
  const gatewayIp = internalGatewayStack.requireOutput("gatewayIp")

  return createDnsRecord(namespace, {
    name: domain,
    type: "A",
    value: gatewayIp,
  })
}

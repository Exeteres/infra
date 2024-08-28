import { getSharedEnvironment, getStack } from "./stack"
import { cloudflare } from "@infra/cloudflare"
import { singleton } from "./utils"

export const getCloudflareProvider = singleton(() => {
  const { cloudflareApiToken } = getSharedEnvironment()

  return new cloudflare.raw.Provider("cloudflare", { apiToken: cloudflareApiToken })
})

export function createDnsRecord(options: Omit<cloudflare.RecordOptions, "zoneId" | "provider">) {
  const { cloudflareZoneId } = getSharedEnvironment()
  const provider = getCloudflareProvider()

  return cloudflare.createRecord({
    zoneId: cloudflareZoneId,

    provider: provider,
    ...options,
  })
}

export function createPublicDnsRecord(domain: string) {
  const { publicIp } = getSharedEnvironment()

  return createDnsRecord({
    name: domain,
    type: "A",
    value: publicIp,
    proxied: true,
  })
}

export function createInternalDnsRecord(domain: string) {
  const internalGatewayStack = getStack("internal-gateway")
  const gatewayIp = internalGatewayStack.requireOutput("gatewayIp")

  return createDnsRecord({
    name: domain,
    type: "A",
    value: gatewayIp,
  })
}

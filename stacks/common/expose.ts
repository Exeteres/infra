import { k8s } from "@infra/k8s"
import { createInternalDnsRecord, createPublicDnsRecord } from "./dns"
import { createWebCertificate } from "./tls"
import { certManager } from "@infra/cert-manager"
import { gw } from "@infra/gateway"
import { cloudflare } from "@infra/cloudflare"
import { singleton } from "./utils"
import { resolveStack } from "./stack"

interface ExposedService {
  dnsRecord: cloudflare.raw.Record
  certificate: certManager.CertificateBundle
  gateway: gw.ApplicationGatewayOptions
}

export const getInternalGatewayService = singleton(() => {
  const internalGatewayStack = resolveStack("internal-gateway")

  return k8s.import(internalGatewayStack, k8s.raw.core.v1.Service, "serviceId")
})

export const getPublicGatewayService = singleton(() => {
  const publicGatewayStack = resolveStack("public-gateway")

  return k8s.import(publicGatewayStack, k8s.raw.core.v1.Service, "serviceId")
})

export function exposePublicService(namespace: k8s.raw.core.v1.Namespace, domain: string): ExposedService {
  const certificate = createWebCertificate(namespace, domain)

  return {
    dnsRecord: createPublicDnsRecord(namespace, domain),
    certificate,
    gateway: {
      domain,
      className: "public",
      service: getPublicGatewayService(),
      certificate,
    },
  }
}

export function exposeInternalService(namespace: k8s.raw.core.v1.Namespace, domain: string): ExposedService {
  const certificate = createWebCertificate(namespace, domain)

  return {
    dnsRecord: createInternalDnsRecord(namespace, domain),
    certificate,
    gateway: {
      domain,
      className: "internal",
      service: getInternalGatewayService(),
      certificate,
    },
  }
}

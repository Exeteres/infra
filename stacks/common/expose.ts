import { k8s } from "@infra/k8s"
import { createInternalDnsRecord, createPublicDnsRecord } from "./dns"
import { createWebCertificate } from "./tls"
import { certManager } from "@infra/cert-manager"
import { gw } from "@infra/gateway"
import { cloudflare } from "@infra/cloudflare"

interface ExposedService {
  dnsRecord: cloudflare.raw.Record
  certificate: certManager.CertificateBundle
  gateway: gw.ApplicationGatewayOptions
}

export function exposePublicService(namespace: k8s.raw.core.v1.Namespace, domain: string): ExposedService {
  const certificate = createWebCertificate(namespace, domain)

  return {
    dnsRecord: createPublicDnsRecord(namespace, domain),
    certificate,
    gateway: {
      domain,
      gatewayClassName: "public",
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
      gatewayClassName: "internal",
      certificate,
    },
  }
}

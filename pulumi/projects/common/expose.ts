import { k8s } from "@infra/k8s"
import { createInternalDnsRecord, createPublicDnsRecord } from "./dns"
import { createWebCertificate } from "./tls"
import { certManager } from "@infra/cert-manager"
import { gw } from "@infra/gateway"
import { cloudflare } from "@infra/cloudflare"
import { singleton } from "./utils"
import { getStack } from "./stack"
import { Input } from "@infra/core"

interface ExposedService {
  dnsRecord: cloudflare.raw.Record
  certificate: certManager.CertificateBundle
  gateway: gw.ApplicationGatewayOptions
}

export const getInternalGatewayService = singleton(() => {
  const internalGatewayStack = getStack("internal-gateway")

  return k8s.import(internalGatewayStack, k8s.raw.core.v1.Service, "serviceId")
})

export const getPublicGatewayService = singleton(() => {
  const publicGatewayStack = getStack("public-gateway")

  return k8s.import(publicGatewayStack, k8s.raw.core.v1.Service, "serviceId")
})

interface ExposeHttpServiceOptions {
  /**
   * The namespace to create a gateway in.
   */
  namespace: k8s.raw.core.v1.Namespace

  /**
   * The domain to expose the service on.
   */
  domain: string

  /**
   * The path prefix to use for the service.
   * If not provided, the service will be exposed at the root of the domain.
   */
  pathPrefix?: string

  /**
   * The extra options to use for the gateway.
   */
  gateway?: Partial<gw.Options>

  /**
   * The extra options to use for the listener.
   */
  listener?: Partial<gw.raw.types.input.gateway.v1.GatewaySpecListenersArgs>
}

export function exposePublicHttpService(options: ExposeHttpServiceOptions): ExposedService {
  const dnsRecord = createPublicDnsRecord(options.domain)
  const service = getPublicGatewayService()

  return exposeHttpService("public", dnsRecord, service, options)
}

export function exposeInternalHttpService(options: ExposeHttpServiceOptions): ExposedService {
  const dnsRecord = createInternalDnsRecord(options.domain)
  const service = getInternalGatewayService()

  return exposeHttpService("internal", dnsRecord, service, options)
}

function exposeHttpService(
  className: string,
  dnsRecord: cloudflare.raw.Record,
  service: Input<k8s.raw.core.v1.Service>,
  options: ExposeHttpServiceOptions,
): ExposedService {
  const certificate = createWebCertificate(options.namespace, options.domain)

  return {
    dnsRecord,
    certificate,
    gateway: {
      pathPrefix: options.pathPrefix,
      gateway: createHttpGateway(certificate, className, options),
      service,
    },
  }
}

function createHttpGateway(
  certificate: certManager.CertificateBundle,
  className: string,
  options: ExposeHttpServiceOptions,
) {
  return gw.createGateway({
    name: options.domain,
    namespace: options.namespace,
    gatewayClassName: className,

    listeners: [
      {
        name: "http",
        port: 8000,
        protocol: "HTTP",
        hostname: options.domain,

        httpRoute: {
          name: "http-to-https",
          rule: {
            filter: {
              type: "RequestRedirect",
              requestRedirect: {
                scheme: "https",
                statusCode: 301,
              },
            },
          },
        },
      },

      {
        name: "https",
        port: 8443,
        protocol: "HTTPS",
        certificate: certificate,
        hostname: options.domain,
        ...options.listener,
      },
    ],

    ...options.gateway,
  })
}

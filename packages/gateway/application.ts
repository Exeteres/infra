import { appendToInputArray, pulumi } from "@infra/core"
import { certManager } from "@infra/cert-manager"
import { Bundle, createGateway, Options } from "./gateway"
import { k8s } from "@infra/k8s"

export interface GatewayApplicationOptions {
  gateway?: ApplicationGatewayOptions
}

export interface GatewayApplication {
  gateway?: Bundle
}

export interface ApplicationGatewayOptions {
  domain: pulumi.Input<string>
  gatewayClassName: pulumi.Input<string>
  certificate: certManager.CertificateBundle
}

export function createApplicationGateway(
  gatewayOptions: ApplicationGatewayOptions | undefined,
  options: Omit<Options, "listerners" | "listener" | "gatewayClassName">,
): Bundle | undefined {
  if (!gatewayOptions) {
    return
  }

  return createGateway({
    name: options.name,
    namespace: options.namespace,

    gatewayClassName: gatewayOptions.gatewayClassName,

    listeners: [
      {
        name: "http",
        port: 8000,
        protocol: "HTTP",

        httpRoute: {
          name: k8s.getPrefixedName("http-to-https", options.name),
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
        certificate: gatewayOptions.certificate,
        hostname: gatewayOptions.domain,

        httpRoute: options.httpRoute,
        httpRoutes: options.httpRoutes,
      },
    ],
  })
}

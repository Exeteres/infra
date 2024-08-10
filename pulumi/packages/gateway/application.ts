import { pulumi } from "@infra/core"
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
  className: pulumi.Input<string>
  service: pulumi.Input<k8s.raw.core.v1.Service>
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

    gatewayClassName: gatewayOptions.className,

    listeners: [
      {
        name: "http",
        port: 8000,
        protocol: "HTTP",
        hostname: gatewayOptions.domain,

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
        grpcRoute: options.grpcRoute,
        grpcRoutes: options.grpcRoutes,
      },
    ],
  })
}

export function createRawApplicationGateway(
  gatewayOptions: ApplicationGatewayOptions | undefined,
  options: Omit<Options, "gatewayClassName">,
): Bundle | undefined {
  if (!gatewayOptions) {
    return
  }

  return createGateway({
    ...options,
    name: options.name,
    namespace: options.namespace,

    gatewayClassName: gatewayOptions.className,
  })
}

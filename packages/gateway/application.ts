import { pulumi } from "@infra/core"
import { certManager } from "@infra/cert-manager"
import { Bundle, createGateway, Options } from "./gateway"

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
    ...options,
    gatewayClassName: gatewayOptions.gatewayClassName,
    listener: {
      name: "https",
      port: 8443,
      protocol: "HTTPS",
      certificate: gatewayOptions.certificate,
      hostname: gatewayOptions.domain,
    },
  })
}

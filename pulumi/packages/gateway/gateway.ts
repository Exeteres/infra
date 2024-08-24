import { all, Input, InputArray, mapInputs, normalizeInputs } from "@infra/core"
import { CommonOptions } from "@infra/k8s/options"
import { certManager } from "@infra/cert-manager"
import { raw } from "./imports"
import { RouteContainer } from "./routes"
import { k8s } from "@infra/k8s"

export type Options = CommonOptions &
  Omit<raw.types.input.gateway.v1.GatewaySpecArgs, "listeners"> & {
    /**
     * The listeners that the Gateway should deploy.
     */
    listeners?: InputArray<ListernerOptions>

    /**
     * The listener that the Gateway should deploy.
     */
    listener?: Input<ListernerOptions>
  }

export type ListernerOptions = Omit<raw.types.input.gateway.v1.GatewaySpecListenersArgs, ""> &
  RouteContainer & {
    /**
     * The certificate to use for the listener.
     */
    certificate?: certManager.CertificateBundle
  }

/**
 * Creates a new Gateway with the given routes.
 *
 * @param options The Gateway options.
 * @returns The gateway bundle.
 */
export function createGateway(options: Options): raw.gateway.v1.Gateway {
  return new raw.gateway.v1.Gateway(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: {
        gatewayClassName: options.gatewayClassName,
        addresses: options.addresses,
        infrastructure: options.infrastructure,

        listeners: mapInputs(normalizeInputs(options.listener, options.listeners), listener => ({
          name: listener.name,
          port: listener.port,
          protocol: listener.protocol,
          hostname: listener.hostname,
          allowedRoutes: listener.allowedRoutes,

          tls: all([listener.tls, listener.certificate]).apply(([tls, certificate]) => {
            if (certificate) {
              return {
                mode: "Terminate",
                certificateRefs: [k8s.resolveRef(certificate.certificate)],
                frontendValidation: tls?.frontendValidation,
                options: tls?.options,
              } satisfies raw.types.input.gateway.v1.GatewaySpecListenersTlsArgs
            }

            return tls!
          }),
        })),
      },
    },
    k8s.mapPulumiOptions(options),
  )
}

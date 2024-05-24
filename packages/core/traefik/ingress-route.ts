import { CommonOptions, crds, mapMetadata, mapPulumiOptions, pulumi } from "../shared"

interface TcpIngressRouteOptions extends CommonOptions {
  /**
   * The fully qualified domain name for the IngressRoute.
   */
  domain: pulumi.Input<string>

  /**
   * The name of the service to route traffic to.
   */
  serviceName: pulumi.Input<string>

  /**
   * The port of the service to route traffic to.
   */
  servicePort: pulumi.Input<number>

  /**
   * Whether to use TLS passthrough.
   * Useful for TCP services that require end-to-end encryption.
   */
  tlsPassthrough?: boolean
}

/**
 * Creates a TCP IngressRoute for Traefik.
 *
 * @param options The TCP IngressRoute options.
 * @returns The TCP IngressRoute.
 */
export function createTcpIngressRoute(options: TcpIngressRouteOptions) {
  return new crds.traefik.v1alpha1.IngressRouteTCP(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        entryPoints: ["websecure"],
        routes: [
          {
            match: `HostSNI(\`${options.domain}\`)`,
            services: [
              {
                name: options.serviceName,
                port: options.servicePort,
              },
            ],
          },
        ],
        tls: {
          passthrough: options.tlsPassthrough,
        },
      },
    },
    mapPulumiOptions(options),
  )
}

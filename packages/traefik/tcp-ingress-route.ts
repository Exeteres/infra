import { k8s } from "@infra/k8s"
import { raw } from "./imports"
import {
  CommonIngressRouteOptions,
  IngressRouteMatchFilter,
  TcpIngressRoute,
  buildMatchExpression,
  mapServiceToCrd,
} from "./shared"
import { normalizeInputArray, normalizeInputArrayAndMap, pulumi } from "@infra/core"

interface TcpIngressRouteOptions extends CommonIngressRouteOptions<TcpIngressRoute> {
  /**
   * Whether to use TLS passthrough.
   * Useful for TCP services that require end-to-end encryption.
   */
  tlsPassthrough?: pulumi.Input<boolean>
}

/**
 * Creates a TCP IngressRoute for Traefik.
 *
 * @param options The TCP IngressRoute options.
 * @returns The TCP IngressRoute.
 */
export function createTcpIngressRoute(options: TcpIngressRouteOptions) {
  return new raw.traefik.v1alpha1.IngressRouteTCP(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: {
        entryPoints: normalizeInputArray(options.entryPoint, options.entryPoints),
        routes: normalizeInputArrayAndMap(options.route, options.routes, mapRouteToCrd),
        tls: {
          passthrough: options.tlsPassthrough,
        },
      },
    },
    k8s.mapPulumiOptions(options),
  )
}

function mapRouteToCrd(
  route: pulumi.Input<TcpIngressRoute>,
): pulumi.Output<raw.types.input.traefik.v1alpha1.IngressRouteTCPSpecRoutesArgs> {
  return pulumi.output(route).apply(route => {
    return {
      match: createTcpIngressRouteMatchFilter(route).apply(buildMatchExpression),
      services: normalizeInputArrayAndMap(route.service, route.services, mapServiceToCrd),
    } satisfies raw.types.input.traefik.v1alpha1.IngressRouteTCPSpecRoutesArgs
  })
}

function createTcpIngressRouteMatchFilter(route: TcpIngressRoute): pulumi.Output<IngressRouteMatchFilter> {
  return pulumi.output(route).apply(route => {
    if (route.domain && route.match) {
      return {
        all: [
          {
            method: "HostSNI",
            args: [route.domain],
          },
          route.match,
        ],
      }
    }

    if (route.match) {
      return route.match
    }

    if (route.domain) {
      return {
        method: "HostSNI",
        args: [route.domain],
      }
    }

    throw new Error("Either 'domain' or 'match' must be specified.")
  })
}

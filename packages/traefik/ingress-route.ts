import { normalizeInputArray, normalizeInputArrayAndMap, pulumi } from "@infra/core"
import {
  CommonIngressRouteOptions,
  IngressRouteMatchFilter,
  TcpIngressRoute,
  buildMatchExpression,
  mapServiceToCrd,
} from "./shared"
import { traefik } from "./imports"
import { mapMetadata, mapPulumiOptions } from "@infra/k8s"

interface IngressRouteOptions extends CommonIngressRouteOptions<TcpIngressRoute> {
  /**
   * The name of the secret containing the certificate to use for TLS.
   */
  tlsSecretName?: pulumi.Input<string>
}

interface IngressRoute extends TcpIngressRoute {
  /**
   * The path to match against the URL of the request.
   */
  path?: pulumi.Input<string>

  /**
   * The paths to match against the URL of the request.
   */
  paths?: pulumi.Input<pulumi.Input<string>[]>
}

/**
 * Creates a IngressRoute for Traefik.
 *
 * @param options The IngressRoute options.
 * @returns The IngressRoute.
 */
export function createIngressRoute(options: IngressRouteOptions) {
  return new traefik.traefik.v1alpha1.IngressRoute(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        entryPoints: normalizeInputArray(options.entryPoint, options.entryPoints),
        routes: normalizeInputArrayAndMap(
          //
          options.route,
          options.routes,
          mapRouteToCrd,
        ),
        tls: {
          secretName: options.tlsSecretName,
        },
      },
    },
    mapPulumiOptions(options),
  )
}

function mapRouteToCrd(
  route: pulumi.Input<IngressRoute>,
): pulumi.Output<traefik.types.input.traefik.v1alpha1.IngressRouteSpecRoutesArgs> {
  return pulumi.output(route).apply(route => {
    return {
      kind: "Rule",
      match: createIngressRouteMatchFilter(route).apply(buildMatchExpression),
      services: normalizeInputArrayAndMap(route.service, route.services, mapServiceToCrd),
    } satisfies traefik.types.input.traefik.v1alpha1.IngressRouteSpecRoutesArgs
  })
}

function createIngressRouteMatchFilter(route: IngressRoute): pulumi.Output<IngressRouteMatchFilter> {
  return pulumi.output(route).apply(route => {
    const matchers: IngressRouteMatchFilter[] = []

    if (route.path) {
      matchers.push({ method: "PathPrefix", args: [route.path] })
    }

    if (route.paths) {
      matchers.push(...route.paths.map(path => ({ method: "PathPrefix", args: [path] })))
    }

    if (route.domain) {
      matchers.push({ method: "Host", args: [route.domain] })
    }

    if (matchers.length && route.match) {
      return {
        all: [...matchers, route.match],
      }
    }

    if (matchers.length) {
      return {
        all: matchers,
      }
    }

    if (route.match) {
      return route.match
    }

    throw new Error("At least one of 'path', 'paths', 'domain' or 'match' must be provided.")
  })
}

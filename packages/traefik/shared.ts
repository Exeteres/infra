import { normalizeInputArrayAndMap, pulumi } from "@infra/core"
import { traefik } from "./imports"
import { CommonOptions } from "@infra/k8s"

export interface CommonIngressRouteOptions<TIngressRoute extends TcpIngressRoute> extends CommonOptions {
  /**
   * The type of entry point.
   */
  entryPoint?: pulumi.Input<string>

  /**
   * The types of entry points.
   */
  entryPoints?: pulumi.Input<pulumi.Input<string>[]>

  /**
   * The configuration of the route.
   */
  route?: pulumi.Input<TIngressRoute>

  /**
   * The configuration of the routes.
   */
  routes?: pulumi.Input<pulumi.Input<TIngressRoute>[]>
}

export interface TcpIngressRoute {
  /**
   * The fully qualified domain name for the IngressRoute.
   */
  domain?: pulumi.Input<string>

  /**
   * The match filter for the IngressRoute.
   */
  match?: pulumi.Input<IngressRouteMatchFilter>

  /**
   * The configuration of the service to route traffic to.
   */
  service?: pulumi.Input<IngressRouteService>

  /**
   * The configuration of the services to route traffic to.
   */
  services?: pulumi.Input<pulumi.Input<IngressRouteService>[]>
}

export interface IngressRouteService {
  /**
   * The name of the service to route traffic to.
   */
  name: pulumi.Input<string>

  /**
   * The port of the service to route traffic to.
   */
  port: pulumi.Input<number>
}

export function mapServiceToCrd(
  service: pulumi.Input<IngressRouteService>,
): pulumi.Output<traefik.types.input.traefik.v1alpha1.IngressRouteTCPSpecRoutesServicesArgs> {
  return pulumi.output(service).apply(service => {
    return {
      name: service.name,
      port: service.port,
    } satisfies traefik.types.input.traefik.v1alpha1.IngressRouteTCPSpecRoutesServicesArgs
  })
}

/**
 * The match filter for the IngressRoute.
 */
export type IngressRouteMatchFilter =
  | {
      /**
       * The method of the match filter.
       */
      method: string

      /**
       * The arguments of the match filter.
       */
      args: string[]
    }
  | {
      /**
       * The list of match filters to match any of them (logical OR).
       */
      any: IngressRouteMatchFilter[]
    }
  | {
      /**
       * The list of match filters to match all of them (logical AND).
       */
      all: IngressRouteMatchFilter[]
    }

export function buildMatchExpression(filter: IngressRouteMatchFilter): string {
  if ("method" in filter) {
    return `${filter.method}(${filter.args.map(mapMatchArg).join(",")})`
  } else if ("any" in filter) {
    return `(${filter.any.map(buildMatchExpression).join(" || ")})`
  } else if ("all" in filter) {
    return `(${filter.all.map(buildMatchExpression).join(" && ")})`
  } else {
    throw new Error("Invalid match filter")
  }
}

function mapMatchArg(arg: string): string {
  return `\`${arg}\``
}

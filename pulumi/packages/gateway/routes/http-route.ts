import { k8s } from "@infra/k8s"
import { raw } from "../imports"
import {
  Input,
  InputArray,
  normalizeInputs,
  output,
  mapOptional,
  PartialKeys,
  all,
  normalizeInputsAndMap,
} from "@infra/core"
import { BackendRef, resolveBackendRef } from "./backend"

export type HttpRouteOptions = PartialKeys<k8s.CommonOptions, "namespace"> &
  Omit<raw.types.input.gateway.v1.HTTPRouteSpecArgs, "rules"> & {
    /**
     * The rules for the HTTP route.
     */
    rules?: InputArray<HttpRouteRuleOptions>

    /**
     * The rule for the HTTP route.
     */
    rule?: Input<HttpRouteRuleOptions>

    /**
     * The gateway to associate with the HTTP route.
     */
    gateway: Input<raw.gateway.v1.Gateway>

    /**
     * The name of the listener to attach the route to.
     * If not provided, the route will be attached to all listeners.
     */
    listenerName?: string
  }

export type HttpRouteRuleOptions = Omit<
  raw.types.input.gateway.v1.HTTPRouteSpecRulesArgs,
  "matches" | "filters" | "backendRefs"
> & {
  /**
   * The conditions of the rule.
   * Can be specified as string to match on the path.
   */
  matches?: InputArray<HttpRouteRuleMatchOptions>

  /**
   * The condition of the rule.
   * Can be specified as string to match on the path.
   */
  match?: Input<HttpRouteRuleMatchOptions>

  /**
   * The filters of the rule.
   */
  filters?: InputArray<raw.types.input.gateway.v1.HTTPRouteSpecRulesFiltersArgs>

  /**
   * The filter of the rule.
   */
  filter?: Input<raw.types.input.gateway.v1.HTTPRouteSpecRulesFiltersArgs>

  /**
   * The service to route to.
   */
  backend?: Input<BackendRef>
}

export type HttpRouteRuleMatchOptions = raw.types.input.gateway.v1.HTTPRouteSpecRulesMatchesArgs | string

export function createHttpRoute(options: HttpRouteOptions): raw.gateway.v1.HTTPRoute {
  const gateway = output(options.gateway)

  return new raw.gateway.v1.HTTPRoute(
    options.name,
    {
      metadata: k8s.mapMetadata(options, {
        namespace: all([options.namespace?.metadata.name, gateway.metadata.apply(m => m!.namespace)]).apply(
          ([namespace, gatewayNamespace]) => namespace ?? gatewayNamespace!,
        ),
      }),
      spec: {
        parentRefs: [
          {
            name: gateway.metadata.apply(metadata => metadata!.name as string),
            namespace: gateway.metadata.apply(metadata => metadata!.namespace as string),
            sectionName: options.listenerName,
          },
        ],
        rules: normalizeInputsAndMap(options.rule, options.rules, rule => ({
          sessionPersistence: rule.sessionPersistence,
          timeouts: rule.timeouts,
          matches: normalizeInputsAndMap(rule.match, rule.matches, mapHttpRouteRuleMatch)
            // Add a default path match if none is provided
            .apply(matches => (matches.length ? matches : [{ path: { type: "PathPrefix", value: "/" } }])),
          filters: normalizeInputs(rule.filter, rule.filters),
          backendRefs: mapOptional(rule.backend, backend => [output(backend).apply(resolveBackendRef)]),
        })),
      },
    },
    k8s.mapPulumiOptions(options),
  )
}

export function mapHttpRouteRuleMatch(
  match: HttpRouteRuleMatchOptions,
): raw.types.input.gateway.v1.HTTPRouteSpecRulesMatchesArgs {
  if (typeof match === "string") {
    return { path: { type: "PathPrefix", value: match } }
  }

  return match
}

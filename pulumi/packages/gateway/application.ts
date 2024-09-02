import {
  appendToInputArray,
  Input,
  mapOptionalInput,
  mapOptionalInputs,
  normalizeInputs,
  output,
  pulumi,
} from "@infra/core"
import { k8s } from "@infra/k8s"
import { Bundle, createRoutes, RouteContainer } from "./routes"
import { raw } from "./imports"
import {
  HttpRouteOptions,
  HttpRouteRuleMatchOptions,
  HttpRouteRuleOptions,
  mapHttpRouteRuleMatch,
} from "./routes/http-route"

export interface GatewayApplicationOptions {
  /**
   * The gateway options for the application.
   * Will be used to create gateway routes.
   */
  gateway?: ApplicationGatewayOptions
}

export interface GatewayApplication {
  /**
   * The gateway and routes of the application.
   */
  gateway?: Bundle
}

export interface ApplicationGatewayOptions {
  /**
   * The path prefix to use.
   * If not provided, the Gateway will route traffic to the root path.
   */
  pathPrefix?: string

  /**
   * The gateway to use for the application.
   */
  gateway: Input<raw.gateway.v1.Gateway>
}

export function createApplicationRoutes(
  namespace: k8s.raw.core.v1.Namespace,
  options: ApplicationGatewayOptions | undefined,
  routeContainer: RouteContainer,
): Bundle | undefined {
  if (!options) {
    return
  }

  if (!options.pathPrefix || options.pathPrefix === "/") {
    return createRoutes({
      gateway: options.gateway,
      namespace,

      httpRoute: routeContainer.httpRoute,
      httpRoutes: routeContainer.httpRoutes,
    })
  }

  return createRoutes({
    gateway: options.gateway,
    namespace,

    httpRoute: mapOptionalInput(routeContainer.httpRoute, addPathPrefixToRoute(options.pathPrefix)),
    httpRoutes: mapOptionalInputs(routeContainer.httpRoutes, addPathPrefixToRoute(options.pathPrefix)),
  })
}

function addPathPrefixToRoute(
  pathPrefix: pulumi.Input<string>,
): (options: Omit<HttpRouteOptions, "gateway">) => Omit<HttpRouteOptions, "gateway"> {
  return route => ({
    ...route,
    rule: mapOptionalInput(route.rule, addPathPrefixToRule(pathPrefix)),
    rules: mapOptionalInputs(route.rules, addPathPrefixToRule(pathPrefix)),
  })
}

function addPathPrefixToRule(pathPrefix: pulumi.Input<string>): (rule: HttpRouteRuleOptions) => HttpRouteRuleOptions {
  return rule => {
    const hasMatches = normalizeInputs(rule.match, rule.matches).apply(matches => !!matches.length)

    return {
      ...rule,
      match: mapOptionalInput(rule.match, addPathPrefixToMatch(pathPrefix)),
      matches: appendToInputArray(
        mapOptionalInputs(rule.matches, addPathPrefixToMatch(pathPrefix)),
        hasMatches.apply(hasMatches => {
          if (hasMatches) {
            return undefined
          }

          // Add a default match if no matches are provided
          return {
            path: {
              type: "PathPrefix",
              value: pathPrefix,
            },
          }
        }),
      ),

      // Add a filter to strip the path prefix
      filters: appendToInputArray(rule.filters, {
        type: "URLRewrite",
        urlRewrite: {
          path: {
            type: "ReplacePrefixMatch",
            replacePrefixMatch: "/",
          },
        },
      }),
    }
  }
}

function addPathPrefixToMatch(
  pathPrefix: pulumi.Input<string>,
): (match: HttpRouteRuleMatchOptions) => HttpRouteRuleMatchOptions {
  return match => {
    const mappedMatch = mapHttpRouteRuleMatch(match)

    if (mappedMatch.path) {
      return {
        path: {
          type: "PathPrefix",
          value: pulumi.interpolate`${pathPrefix}${output(mappedMatch.path).value}`,
        },
      }
    }

    return {
      ...mappedMatch,
      path: {
        type: "PathPrefix",
        value: pathPrefix,
      },
    }
  }
}

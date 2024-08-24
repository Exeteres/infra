import { Input, InputArray, mapInputs, normalizeInputs, output, Output, pulumi } from "@infra/core"
import { createHttpRoute, HttpRouteOptions } from "./http-route"
import { raw } from "../imports"
import { k8s } from "@infra/k8s"

export interface RouteContainer {
  /**
   * The HTTP routes to create and attach to the Gateway.
   */
  httpRoutes?: InputArray<Omit<HttpRouteOptions, "gateway">>

  /**
   * The HTTP route to create and attach to the Gateway.
   */
  httpRoute?: Input<Omit<HttpRouteOptions, "gateway">>
}

export interface RouteContainerOptions extends RouteContainer {
  /**
   * The gateway to associate routes with.
   */
  gateway: Input<raw.gateway.v1.Gateway>

  /**
   * The name of the listener to attach the routes to.
   * If not provided, the route will be attached to all listeners.
   */
  listenerName?: string

  /**
   * The namespace to create the routes in.
   * If not provided, the routes will be created in the same namespace as the Gateway.
   */
  namespace?: k8s.raw.core.v1.Namespace
}

export interface Bundle {
  /**
   * The Gateway that the routes are attached to.
   */
  gateway: Output<raw.gateway.v1.Gateway>

  /**
   * The created HTTP routes.
   */
  httpRoutes: Output<raw.gateway.v1.HTTPRoute[]>
}

export function createRoutes(options: RouteContainerOptions): Bundle {
  return {
    gateway: output(options.gateway),

    httpRoutes: mapInputs(normalizeInputs(options.httpRoute, options.httpRoutes), route => {
      return createHttpRoute({
        ...route,
        namespace: options.namespace,
        gateway: options.gateway,
        listenerName: options.listenerName,
      })
    }),
  }
}

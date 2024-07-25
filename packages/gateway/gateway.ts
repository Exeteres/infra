import { InputArray, normalizeInputArray, normalizeInputArrayAndMap, pulumi } from "@infra/core"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "@infra/k8s/options"
import { certManager } from "@infra/cert-manager"
import { raw } from "./imports"

interface RouteContainer {
  /**
   * The HTTP routes to create and attach to the Gateway.
   */
  httpRoutes?: InputArray<ChildHttpRouteOptions>

  /**
   * The HTTP route to create and attach to the Gateway.
   */
  httpRoute?: pulumi.Input<ChildHttpRouteOptions>

  /**
   * The GRPC routes to create and attach to the Gateway.
   */
  grpcRoutes?: InputArray<ChildGrpcRouteOptions>

  /**
   * The GRPC route to create and attach to the Gateway.
   */
  grpcRoute?: pulumi.Input<ChildGrpcRouteOptions>

  /**
   * The TLS routes to create and attach to the Gateway.
   */
  tlsRoutes?: InputArray<ChildTlsRouteOptions>

  /**
   * The TLS route to create and attach to the Gateway.
   */
  tlsRoute?: pulumi.Input<ChildTlsRouteOptions>

  /**
   * The TCP routes to create and attach to the Gateway.
   */
  tcpRoutes?: InputArray<ChildTcpRouteOptions>

  /**
   * The TCP route to create and attach to the Gateway.
   */
  tcpRoute?: pulumi.Input<ChildTcpRouteOptions>

  /**
   * The UDP routes to create and attach to the Gateway.
   */
  udpRoutes?: InputArray<ChildUdpRouteOptions>

  /**
   * The UDP route to create and attach to the Gateway.
   */
  udpRoute?: pulumi.Input<ChildUdpRouteOptions>
}

export type Options = CommonOptions &
  Omit<raw.types.input.gateway.v1.GatewaySpecArgs, "listeners"> &
  RouteContainer & {
    /**
     * The listeners that the Gateway should deploy.
     */
    listeners?: InputArray<ListernerOptions>

    /**
     * The listener that the Gateway should deploy.
     */
    listener?: pulumi.Input<ListernerOptions>
  }

export type ListernerOptions = Omit<raw.types.input.gateway.v1.GatewaySpecListenersArgs, ""> &
  RouteContainer & {
    certificate?: certManager.CertificateBundle
  }

export type ChildHttpRouteOptions = Omit<CommonOptions, "namespace"> &
  Omit<raw.types.input.gateway.v1.HTTPRouteSpecArgs, "rules"> & {
    /**
     * The rules that the HTTP route should deploy.
     */
    rules?: InputArray<HttpRouteRuleOptions>

    /**
     * The rule that the HTTP route should deploy.
     */
    rule?: pulumi.Input<HttpRouteRuleOptions>
  }

export type HttpRouteRuleOptions = Omit<
  raw.types.input.gateway.v1.HTTPRouteSpecRulesArgs,
  "matches" | "filters" | "backendRefs"
> & {
  /**
   * The matches that the rule should deploy.
   */
  matches?: InputArray<HttpRouteRuleMatchOptions>

  /**
   * The match that the rule should deploy.
   */
  match?: pulumi.Input<HttpRouteRuleMatchOptions>

  /**
   * The filters that the rule should deploy.
   */
  filters?: InputArray<raw.types.input.gateway.v1.HTTPRouteSpecRulesFiltersArgs>

  /**
   * The filter that the rule should deploy.
   */
  filter?: pulumi.Input<raw.types.input.gateway.v1.HTTPRouteSpecRulesFiltersArgs>

  /**
   * The backendRefs that the rule should deploy.
   */
  backendRefs?: InputArray<raw.types.input.gateway.v1.HTTPRouteSpecRulesBackendRefsArgs>

  /**
   * The backendRef that the rule should deploy.
   */
  backendRef?: pulumi.Input<raw.types.input.gateway.v1.HTTPRouteSpecRulesBackendRefsArgs>
}

export type HttpRouteRuleMatchOptions = raw.types.input.gateway.v1.HTTPRouteSpecRulesMatchesArgs | string

export type ChildGrpcRouteOptions = Omit<CommonOptions, "namespace"> &
  raw.types.input.gateway.v1.GRPCRouteSpecArgs & {
    /**
     * The rules that the GRPC route should deploy.
     */
    rules?: InputArray<raw.types.input.gateway.v1.GRPCRouteSpecRulesArgs>

    /**
     * The rule that the GRPC route should deploy.
     */
    rule?: pulumi.Input<raw.types.input.gateway.v1.GRPCRouteSpecRulesArgs>
  }

export type ChildTlsRouteOptions = Omit<CommonOptions, "namespace"> &
  raw.types.input.gateway.v1alpha2.TLSRouteSpecArgs & {
    /**
     * The rules that the TLS route should deploy.
     */
    rules?: InputArray<raw.types.input.gateway.v1alpha2.TLSRouteSpecRulesArgs>

    /**
     * The rule that the TLS route should deploy.
     */
    rule?: pulumi.Input<raw.types.input.gateway.v1alpha2.TLSRouteSpecRulesArgs>
  }

export type ChildTcpRouteOptions = Omit<CommonOptions, "namespace"> &
  raw.types.input.gateway.v1alpha2.TCPRouteSpecArgs & {
    /**
     * The rules that the TCP route should deploy.
     */
    rules?: InputArray<raw.types.input.gateway.v1alpha2.TCPRouteSpecRulesArgs>

    /**
     * The rule that the TCP route should deploy.
     */
    rule?: pulumi.Input<raw.types.input.gateway.v1alpha2.TCPRouteSpecRulesArgs>
  }

export type ChildUdpRouteOptions = Omit<CommonOptions, "namespace"> &
  raw.types.input.gateway.v1alpha2.UDPRouteSpecArgs & {
    /**
     * The rules that the UDP route should deploy.
     */
    rules?: InputArray<raw.types.input.gateway.v1alpha2.UDPRouteSpecRulesArgs>

    /**
     * The rule that the UDP route should deploy.
     */
    rule?: pulumi.Input<raw.types.input.gateway.v1alpha2.UDPRouteSpecRulesArgs>
  }

export interface Bundle {
  /**
   * The created Gateway.
   */
  gateway: raw.gateway.v1.Gateway

  /**
   * The created HTTP routes.
   */
  httpRoutes: raw.gateway.v1.HTTPRoute[]

  /**
   * The created GRPC routes.
   */
  grpcRoutes: raw.gateway.v1.GRPCRoute[]

  /**
   * The created TLS routes.
   */
  tlsRoutes: raw.gateway.v1alpha2.TLSRoute[]

  /**
   * The created TCP routes.
   */
  tcpRoutes: raw.gateway.v1alpha2.TCPRoute[]

  /**
   * The created UDP routes.
   */
  udpRoutes: raw.gateway.v1alpha2.UDPRoute[]
}

/**
 * Creates a new Gateway with the given routes.
 *
 * @param options The ingress options.
 * @returns The Ingress.
 */
export function createGateway(options: Options): Bundle {
  const httpRoutes: raw.gateway.v1.HTTPRoute[] = []
  const grpcRoutes: raw.gateway.v1.GRPCRoute[] = []
  const tlsRoutes: raw.gateway.v1alpha2.TLSRoute[] = []
  const tcpRoutes: raw.gateway.v1alpha2.TCPRoute[] = []
  const udpRoutes: raw.gateway.v1alpha2.UDPRoute[] = []

  function createRoutes(
    routeContainer: RouteContainer,
    parentRef: raw.types.input.gateway.v1.HTTPRouteSpecParentRefsArgs,
  ): pulumi.Output<void> {
    return pulumi
      .all([
        normalizeInputArray(routeContainer.httpRoute, routeContainer.httpRoutes),
        normalizeInputArray(routeContainer.grpcRoute, routeContainer.grpcRoutes),
        normalizeInputArray(routeContainer.tlsRoute, routeContainer.tlsRoutes),
        normalizeInputArray(routeContainer.tcpRoute, routeContainer.tcpRoutes),
        normalizeInputArray(routeContainer.udpRoute, routeContainer.udpRoutes),
      ])
      .apply(([httpRouteSpecs, grpcRouteSpecs, tlsRouteSpecs, tcpRouteSpecs, udpRouteSpecs]) => {
        for (const httpRouteSpec of httpRouteSpecs) {
          const httpRoute = new raw.gateway.v1.HTTPRoute(
            httpRouteSpec.name,
            {
              metadata: mapMetadata(httpRouteSpec, { namespace: options.namespace.metadata.name }),
              spec: {
                hostnames: httpRouteSpec.hostnames,
                parentRefs: [parentRef],
                rules: normalizeInputArrayAndMap(httpRouteSpec.rule, httpRouteSpec.rules, rule => ({
                  sessionPersistence: rule.sessionPersistence,
                  timeouts: rule.timeouts,
                  matches: normalizeInputArrayAndMap(rule.match, rule.matches, match => {
                    if (typeof match === "string") {
                      return { path: { type: "PathPrefix", value: match } }
                    }

                    return match
                  }),
                  filters: normalizeInputArray(rule.filter, rule.filters),
                  backendRefs: normalizeInputArray(rule.backendRef, rule.backendRefs),
                })),
              },
            },
            mapPulumiOptions(httpRouteSpec, { parent: options.namespace }),
          )

          httpRoutes.push(httpRoute)
        }

        for (const grpcRouteSpec of grpcRouteSpecs) {
          const grpcRoute = new raw.gateway.v1.GRPCRoute(
            grpcRouteSpec.name,
            {
              metadata: mapMetadata(grpcRouteSpec, { namespace: options.namespace.metadata.name }),
              spec: {
                ...grpcRouteSpec,
                parentRefs: [parentRef],
                rules: normalizeInputArray(grpcRouteSpec.rule, grpcRouteSpec.rules),
              },
            },
            mapPulumiOptions(grpcRouteSpec, { parent: options.namespace }),
          )

          grpcRoutes.push(grpcRoute)
        }

        for (const tlsRouteSpec of tlsRouteSpecs) {
          const tlsRoute = new raw.gateway.v1alpha2.TLSRoute(
            tlsRouteSpec.name,
            {
              metadata: mapMetadata(tlsRouteSpec, { namespace: options.namespace.metadata.name }),
              spec: {
                ...tlsRouteSpec,
                parentRefs: [parentRef],
                rules: normalizeInputArray(tlsRouteSpec.rule, tlsRouteSpec.rules),
              },
            },
            mapPulumiOptions(tlsRouteSpec, { parent: options.namespace }),
          )

          tlsRoutes.push(tlsRoute)
        }

        for (const tcpRouteSpec of tcpRouteSpecs) {
          const tcpRoute = new raw.gateway.v1alpha2.TCPRoute(
            tcpRouteSpec.name,
            {
              metadata: mapMetadata(tcpRouteSpec, { namespace: options.namespace.metadata.name }),
              spec: {
                ...tcpRouteSpec,
                parentRefs: [parentRef],
                rules: normalizeInputArray(tcpRouteSpec.rule, tcpRouteSpec.rules),
              },
            },
            mapPulumiOptions(tcpRouteSpec, { parent: options.namespace }),
          )

          tcpRoutes.push(tcpRoute)
        }

        for (const udpRouteSpec of udpRouteSpecs) {
          const udpRoute = new raw.gateway.v1alpha2.UDPRoute(
            udpRouteSpec.name,
            {
              metadata: mapMetadata(udpRouteSpec, { namespace: options.namespace.metadata.name }),
              spec: {
                ...udpRouteSpec,
                parentRefs: [parentRef],
                rules: normalizeInputArray(udpRouteSpec.rule, udpRouteSpec.rules),
              },
            },
            mapPulumiOptions(udpRouteSpec, { parent: options.namespace }),
          )

          udpRoutes.push(udpRoute)
        }
      })
  }

  const gateway = new raw.gateway.v1.Gateway(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: pulumi
        .output({
          gatewayClassName: options.gatewayClassName,
          addresses: options.addresses,
          infrastructure: options.infrastructure,
          listeners: normalizeInputArrayAndMap(options.listener, options.listeners, listener => {
            return createRoutes(listener, {
              name: options.name,
              sectionName: listener.name,
            }).apply(() => {
              return {
                name: listener.name,
                port: listener.port,
                protocol: listener.protocol,
                allowedRoutes: listener.allowedRoutes,
                hostname: listener.hostname,
                tls:
                  listener.protocol === "HTTPS"
                    ? {
                        ...listener?.tls,
                        certificateRefs: listener?.certificate
                          ? [{ kind: "Secret", name: listener.certificate.secretName }]
                          : [],
                      }
                    : undefined,
              } satisfies raw.types.input.gateway.v1.GatewaySpecListenersArgs
            })
          }),
        } satisfies raw.types.input.gateway.v1.GatewaySpecArgs)
        .apply(spec => {
          return createRoutes(options, {
            name: options.name,
          }).apply(() => spec)
        }),
    },
    mapPulumiOptions(options),
  )

  return {
    gateway,
    httpRoutes,
    grpcRoutes,
    tlsRoutes,
    tcpRoutes,
    udpRoutes,
  }
}

export function isGatewayBundle(value: any): value is Bundle {
  return value && value.gateway instanceof raw.gateway.v1.Gateway
}

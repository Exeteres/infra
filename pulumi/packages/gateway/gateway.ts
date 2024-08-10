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

export type GrpcRouteRuleOptions = Omit<
  raw.types.input.gateway.v1.GRPCRouteSpecRulesArgs,
  "matches" | "filters" | "backendRefs"
> & {
  /**
   * The matches that the rule should deploy.
   */
  matches?: InputArray<raw.types.input.gateway.v1.GRPCRouteSpecRulesMatchesArgs>

  /**
   * The match that the rule should deploy.
   */
  match?: pulumi.Input<raw.types.input.gateway.v1.GRPCRouteSpecRulesMatchesArgs>

  /**
   * The filters that the rule should deploy.
   */
  filters?: InputArray<raw.types.input.gateway.v1.GRPCRouteSpecRulesFiltersArgs>

  /**
   * The filter that the rule should deploy.
   */
  filter?: pulumi.Input<raw.types.input.gateway.v1.GRPCRouteSpecRulesFiltersArgs>

  /**
   * The backendRefs that the rule should deploy.
   */
  backendRefs?: InputArray<raw.types.input.gateway.v1.GRPCRouteSpecRulesBackendRefsArgs>

  /**
   * The backendRef that the rule should deploy.
   */
  backendRef?: pulumi.Input<raw.types.input.gateway.v1.GRPCRouteSpecRulesBackendRefsArgs>
}

export type TcpRouteRuleOptions = Omit<raw.types.input.gateway.v1alpha2.TCPRouteSpecRulesArgs, "backendRefs"> & {
  /**
   * The backendRefs that the rule should deploy.
   */
  backendRefs?: InputArray<raw.types.input.gateway.v1alpha2.TCPRouteSpecRulesBackendRefsArgs>

  /**
   * The backendRef that the rule should deploy.
   */
  backendRef?: pulumi.Input<raw.types.input.gateway.v1alpha2.TCPRouteSpecRulesBackendRefsArgs>
}

export type UdpRouteRuleOptions = Omit<raw.types.input.gateway.v1alpha2.UDPRouteSpecRulesArgs, "backendRefs"> & {
  /**
   * The backendRefs that the rule should deploy.
   */
  backendRefs?: InputArray<raw.types.input.gateway.v1alpha2.UDPRouteSpecRulesBackendRefsArgs>

  /**
   * The backendRef that the rule should deploy.
   */
  backendRef?: pulumi.Input<raw.types.input.gateway.v1alpha2.UDPRouteSpecRulesBackendRefsArgs>
}

export type TlsRouteRuleOptions = Omit<raw.types.input.gateway.v1alpha2.TLSRouteSpecRulesArgs, "backendRefs"> & {
  /**
   * The backendRefs that the rule should deploy.
   */
  backendRefs?: InputArray<raw.types.input.gateway.v1alpha2.TLSRouteSpecRulesBackendRefsArgs>

  /**
   * The backendRef that the rule should deploy.
   */
  backendRef?: pulumi.Input<raw.types.input.gateway.v1alpha2.TLSRouteSpecRulesBackendRefsArgs>
}

export type HttpRouteRuleMatchOptions = raw.types.input.gateway.v1.HTTPRouteSpecRulesMatchesArgs | string

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

export type ChildGrpcRouteOptions = Omit<CommonOptions, "namespace"> &
  Omit<raw.types.input.gateway.v1.GRPCRouteSpecArgs, "rules"> & {
    /**
     * The rules that the GRPC route should deploy.
     */
    rules?: InputArray<GrpcRouteRuleOptions>

    /**
     * The rule that the GRPC route should deploy.
     */
    rule?: pulumi.Input<GrpcRouteRuleOptions>
  }

export type ChildTlsRouteOptions = Omit<CommonOptions, "namespace"> &
  Omit<raw.types.input.gateway.v1alpha2.TLSRouteSpecArgs, "rules"> & {
    /**
     * The rules that the TLS route should deploy.
     */
    rules?: InputArray<TlsRouteRuleOptions>

    /**
     * The rule that the TLS route should deploy.
     */
    rule?: pulumi.Input<TlsRouteRuleOptions>
  }

export type ChildTcpRouteOptions = Omit<CommonOptions, "namespace"> &
  Omit<raw.types.input.gateway.v1alpha2.TCPRouteSpecArgs, "rules"> & {
    /**
     * The rules that the TCP route should deploy.
     */
    rules?: InputArray<TcpRouteRuleOptions>

    /**
     * The rule that the TCP route should deploy.
     */
    rule?: pulumi.Input<TcpRouteRuleOptions>
  }

export type ChildUdpRouteOptions = Omit<CommonOptions, "namespace"> &
  Omit<raw.types.input.gateway.v1alpha2.UDPRouteSpecArgs, "rules"> & {
    /**
     * The rules that the UDP route should deploy.
     */
    rules?: InputArray<UdpRouteRuleOptions>

    /**
     * The rule that the UDP route should deploy.
     */
    rule?: pulumi.Input<UdpRouteRuleOptions>
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
                parentRefs: [parentRef],
                hostnames: grpcRouteSpec.hostnames,
                rules: normalizeInputArrayAndMap(grpcRouteSpec.rule, grpcRouteSpec.rules, rule => ({
                  matches: normalizeInputArray(rule.match, rule.matches),
                  filters: normalizeInputArray(rule.filter, rule.filters),
                  backendRefs: normalizeInputArray(rule.backendRef, rule.backendRefs),
                })),
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
                hostnames: tlsRouteSpec.hostnames,
                parentRefs: [parentRef],
                rules: normalizeInputArrayAndMap(tlsRouteSpec.rule, tlsRouteSpec.rules, rule => ({
                  backendRefs: normalizeInputArray(rule.backendRef, rule.backendRefs),
                })),
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
                parentRefs: [parentRef],
                rules: normalizeInputArrayAndMap(tcpRouteSpec.rule, tcpRouteSpec.rules, rule => ({
                  backendRefs: normalizeInputArray(rule.backendRef, rule.backendRefs),
                })),
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
                parentRefs: [parentRef],
                rules: normalizeInputArrayAndMap(udpRouteSpec.rule, udpRouteSpec.rules, rule => ({
                  backendRefs: normalizeInputArray(rule.backendRef, rule.backendRefs),
                })),
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
                    : listener.tls,
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

import { k8s } from "@infra/k8s"
import { raw } from "./imports"
import {
  Input,
  InputArray,
  mapObjectKeys,
  mapOptionalInput,
  mergeInputArrays,
  normalizeInputs,
  normalizeInputsAndMap,
  pulumi,
  undefinedIfEmpty,
} from "@infra/core"

export interface PolicyOptions extends k8s.CommonOptions {
  /**
   * The description of the network policy.
   */
  description: string

  /**
   * Whether the network policy is a cluster-wide network policy.
   * By default, network policies are namespace-scoped.
   */
  isClusterwide?: boolean

  /**
   * The selector to apply the network policy to.
   */
  endpointSelector?: Input<k8s.LabelSelector>

  /**
   * The egress policy for the network policy.
   * All conditions in policy are ANDed together.
   */
  egress?: EgressPolicy

  /**
   * The egress policies for the network policy.
   * All conditions in single policy are ANDed together, but policies are ORed together.
   */
  egresses?: EgressPolicy[]

  /**
   * The ingress policy for the network policy.
   * All conditions in policy are ANDed together.
   */
  ingress?: IngressPolicy

  /**
   * The ingress policies for the network policy.
   * All conditions in single policy are ANDed together, but policies are ORed together.
   */
  ingresses?: IngressPolicy[]
}

export interface EgressPolicy {
  /**
   * The FQDN to allow egress to.
   */
  toFQDN?: Input<string>

  /**
   * The list of FQDNs to allow egress to.
   */
  toFQDNs?: InputArray<string>

  /**
   * The endpoint selector to allow egress to.
   */
  toEndpoint?: Input<k8s.LabelSelector>

  /**
   * The list of endpoint selectors to allow egress to.
   */
  toEndpoints?: InputArray<k8s.LabelSelector>

  /**
   * The service to allow egress to.
   */
  toService?: Input<k8s.raw.core.v1.Service>

  /**
   * The list of services to allow egress to.
   */
  toServices?: InputArray<k8s.raw.core.v1.Service>

  /**
   * The entity to allow egress to.
   */
  toEntity?: Input<PolicyEntity>

  /**
   * The list of entities to allow egress to.
   */
  toEntities?: InputArray<PolicyEntity>

  /**
   * The port selector to allow egress to.
   */
  toPort?: Input<PortSelector>

  /**
   * The list of port selectors to allow egress to.
   */
  toPorts?: InputArray<PortSelector>
}

export interface IngressPolicy {
  /**
   * The endpoint selector to allow ingress from.
   */
  fromEndpoint?: Input<k8s.LabelSelector>

  /**
   * The list of endpoint selectors to allow ingress from.
   */
  fromEndpoints?: InputArray<k8s.LabelSelector>

  /**
   * The service to allow ingress from.
   */
  fromService?: Input<k8s.raw.core.v1.Service>

  /**
   * The list of services to allow ingress from.
   */
  fromServices?: InputArray<k8s.raw.core.v1.Service>

  /**
   * The entity to allow ingress from.
   */
  fromEntity?: Input<PolicyEntity>

  /**
   * The list of entities to allow ingress from.
   */
  fromEntities?: InputArray<PolicyEntity>

  /**
   * The port selector to allow egress to.
   */
  toPort?: Input<PortSelector>

  /**
   * The list of port selectors to allow egress to.
   */
  toPorts?: InputArray<PortSelector>
}

export type PortSelector = FullPortSelector | number | string

export interface FullPortSelector {
  /**
   * The port number.
   */
  port: number | string

  /**
   * The protocol in upper case (e.g. "TCP", "UDP") or "ANY".
   */
  protocol: PortProtocol
}

export type PortProtocol = "TCP" | "UDP" | "ANY"

export type PolicyEntity =
  | "host"
  | "remote-node"
  | "kube-apiserver"
  | "ingress"
  | "cluster"
  | "init"
  | "health"
  | "unmanaged"
  | "world"
  | "all"

export type Policy = raw.cilium.v2.CiliumNetworkPolicy | raw.cilium.v2.CiliumClusterwideNetworkPolicy

export function createPolicy(options: PolicyOptions): Policy {
  const constructor = options.isClusterwide
    ? raw.cilium.v2.CiliumClusterwideNetworkPolicy
    : raw.cilium.v2.CiliumNetworkPolicy

  return new constructor(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: {
        description: options.description,
        endpointSelector: mapOptionalInput(options.endpointSelector, k8s.mapLabelSelector, {}),
        egress: undefinedIfEmpty(
          normalizeInputsAndMap(options.egress, options.egresses, egress => ({
            toFQDNs: undefinedIfEmpty(normalizeInputsAndMap(egress.toFQDN, egress.toFQDNs, mapFQDNSelector)),
            toEndpoints: undefinedIfEmpty(
              mergeInputArrays(
                normalizeInputsAndMap(egress.toEndpoint, egress.toEndpoints, k8s.mapLabelSelector),
                normalizeInputsAndMap(egress.toService, egress.toServices, mapServiceSelector),
              ),
            ),
            // toServices: undefinedIfEmpty(
            //   normalizeInputsAndMap(egress.toService, egress.toServices, mapServiceSelector),
            // ),
            toEntities: undefinedIfEmpty(normalizeInputs(egress.toEntity, egress.toEntities)),
            toPorts: undefinedIfEmpty(normalizeInputsAndMap(egress.toPort, egress.toPorts, mapPortSelector)),
          })),
        ),
        ingress: undefinedIfEmpty(
          normalizeInputsAndMap(options.ingress, options.ingresses, ingress => ({
            fromEndpoints: undefinedIfEmpty(
              mergeInputArrays(
                normalizeInputsAndMap(ingress.fromEndpoint, ingress.fromEndpoints, k8s.mapLabelSelector),
                normalizeInputsAndMap(ingress.fromService, ingress.fromServices, mapServiceSelector),
              ),
            ),
            // fromServices: undefinedIfEmpty(
            //   normalizeInputsAndMap(ingress.fromService, ingress.fromServices, mapServiceSelector),
            // ),
            fromEntities: undefinedIfEmpty(normalizeInputs(ingress.fromEntity, ingress.fromEntities)),
            toPorts: undefinedIfEmpty(normalizeInputsAndMap(ingress.toPort, ingress.toPorts, mapPortSelector)),
          })),
        ),
      },
    },
    k8s.mapPulumiOptions(options),
  )
}

export function mapPortSelector(selector: PortSelector) {
  if (typeof selector === "object") {
    return {
      ports: [
        {
          port: String(selector.port),
          protocol: selector.protocol,
        },
      ],
    }
  }

  return {
    ports: [
      {
        port: String(selector),
        protocol: "ANY",
      },
    ],
  }
}

export function mapServiceSelector(service: k8s.raw.core.v1.Service) {
  // TODO: Use native implementation (https://github.com/cilium/cilium/issues/34021)
  // return {
  //   k8sService: {
  //     serviceName: service.metadata.name,
  //     namespace: service.metadata.namespace,
  //   },
  // }

  return pulumi
    .all([service.spec.selector, service.metadata.namespace])
    .apply(([selector, namespace]) => ({
      ...mapObjectKeys(key => `k8s:${key}`, selector),
      "k8s:io.kubernetes.pod.namespace": namespace,
    }))
    .apply(k8s.mapLabelSelector)
}

export function mapFQDNSelector(fqdn: string) {
  if (fqdn.includes("*")) {
    return { matchPattern: fqdn }
  }

  return { matchName: fqdn }
}

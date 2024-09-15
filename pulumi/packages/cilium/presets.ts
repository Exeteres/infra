import { k8s } from "@infra/k8s"
import { createPolicy } from "./policy"
import { Input, InputArray, RequiredKeys } from "@infra/core"

export interface NamespacePolicyOptions {
  /**
   * The name of the policy.
   * If not provided, a default name will be generated.
   */
  name?: string

  /**
   * The namespace to allow traffic inside.
   */
  namespace: k8s.raw.core.v1.Namespace
}

export function createAllowInsideNamespacePolicy(options: NamespacePolicyOptions) {
  return createPolicy({
    name: options.name ?? "allow-inside-namespace",
    namespace: options.namespace,

    description: "Allows traffic inside the namespace",

    ingress: {
      fromEndpoint: {
        "k8s:io.kubernetes.pod.namespace": options.namespace.metadata.name,
      },
    },

    egress: {
      toEndpoint: {
        "k8s:io.kubernetes.pod.namespace": options.namespace.metadata.name,
      },
    },
  })
}

export function createAllowAllForNamespacePolicy(options: NamespacePolicyOptions) {
  return createPolicy({
    name: options.name ?? "allow-all-for-namespace",
    namespace: options.namespace,

    description: "Allows all traffic for endpoints in the namespace",

    ingress: {
      fromEntity: "all",
    },

    egress: {
      toEntity: "all",
    },
  })
}

export function createAllowInternetPolicy(options: NamespacePolicyOptions) {
  return createPolicy({
    name: options.name ?? "allow-internet",
    namespace: options.namespace,

    description: "Allows traffic to the internet",

    egress: {
      toEntity: "world",
    },

    ingress: {
      fromEntity: "world",
    },
  })
}

export function createAllowApiServerPolicy(options: NamespacePolicyOptions) {
  return createPolicy({
    name: options.name ?? "allow-api-server",
    namespace: options.namespace,

    description: "Allows traffic to the Kubernetes API server",

    egress: {
      toEntity: "kube-apiserver",
    },
  })
}

export function createAllowFromNamespacesPolicy(options: NamespacePolicyOptions) {
  return createPolicy({
    name: options.name ?? "allow-from-namespaces",
    namespace: options.namespace,

    description: "Allows traffic from other namespaces",

    ingress: {
      fromEntity: "cluster",
    },
  })
}

export function createAllowToNamespacesPolicy(options: NamespacePolicyOptions) {
  return createPolicy({
    name: options.name ?? "allow-to-namespaces",
    namespace: options.namespace,

    description: "Allows traffic to other namespaces",

    egress: {
      toEntity: "cluster",
    },
  })
}

export interface AllowServicePolicyOptions extends RequiredKeys<NamespacePolicyOptions, "name"> {
  /**
   * The description of the policy.
   */
  description: string

  /**
   * The service to allow traffic to.
   */
  service?: Input<k8s.raw.core.v1.Service>
}

export function createAllowServicePolicy(options: AllowServicePolicyOptions) {
  return createPolicy({
    name: options.name,
    namespace: options.namespace,

    description: options.description,

    egress: {
      toService: options.service,
    },
  })
}

export interface AllowWebPolicyOptions extends RequiredKeys<NamespacePolicyOptions, "name"> {
  /**
   * The description of the policy.
   */
  description: string

  /**
   * The domain to allow traffic to.
   */
  domain?: Input<string>

  /**
   * The domains to allow traffic to.
   */
  domains?: InputArray<string>

  /**
   * The endpoint selector to use.
   */
  endpointSelector?: Input<k8s.LabelSelector>
}

export function createAllowWebPolicy(options: AllowWebPolicyOptions) {
  return createPolicy({
    name: options.name,
    namespace: options.namespace,

    description: options.description,

    endpointSelector: options.endpointSelector,

    egress: {
      toFQDN: options.domain,
      toFQDNs: options.domains,
    },
  })
}

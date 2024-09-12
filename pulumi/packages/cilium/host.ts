import { createPolicy, PolicyOptions } from "./policy"

export type HostPolicyOptions = Omit<PolicyOptions, "namespace" | "isClusterwide" | "endpointSelector">

export function createHostPolicy(options: HostPolicyOptions) {
  return createPolicy({
    ...options,
    isClusterwide: true,
    nodeSelector: options.nodeSelector ?? { "reserved:host": "" },
  })
}

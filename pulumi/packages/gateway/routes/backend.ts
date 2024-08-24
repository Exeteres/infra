import { all, Input, output, Output } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface FullBackendRef {
  /**
   * The name of the resource being referenced.
   */
  name: Input<string>

  /**
   * The namespace of the resource being referenced.
   * May be undefined if the resource is not in a namespace.
   */
  namespace?: Input<string | undefined>

  /**
   * The port of the resource being referenced.
   */
  port: Input<number>
}

export interface ServiceBackendRef {
  /**
   * The name of the service being referenced.
   */
  service: Input<k8s.raw.core.v1.Service>

  /**
   * The port of the service being referenced.
   */
  port: Input<number> | Input<string>
}

export interface ResolvedServiceRef {
  /**
   * The name of the resource being referenced.
   */
  name: string

  /**
   * The namespace of the resource being referenced.
   * May be undefined if the resource is not in a namespace.
   */
  namespace?: string

  /**
   * The port of the resource being referenced.
   */
  port: number
}

export type BackendRef = FullBackendRef | ServiceBackendRef | k8s.raw.core.v1.Service

export function resolveBackendRef(ref: BackendRef): Output<ResolvedServiceRef> {
  if (k8s.raw.core.v1.Service.isInstance(ref)) {
    return output({
      name: ref.metadata.name,
      namespace: ref.metadata.namespace,
      port: ref.spec.ports[0].port,
    })
  }

  if ("service" in ref) {
    const service = output(ref.service)

    return output({
      name: service.metadata.name,
      namespace: service.metadata.namespace,
      port: all([ref.service, ref.port]).apply(([service, port]) => {
        return typeof port === "number" ? output(port) : k8s.getRequiredServicePortByName(service, port)
      }),
    })
  }

  return output({
    name: ref.name,
    namespace: ref.namespace,
    port: ref.port,
  })
}

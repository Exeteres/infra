import { all, Input, Output, pulumi } from "@infra/core"

export interface FullRef {
  /**
   * The name of the resource being referenced.
   */
  name: Input<string>

  /**
   * The namespace of the resource being referenced.
   * May be undefined if the resource is not in a namespace.
   */
  namespace?: Input<string | undefined>
}

export type ReferencedResource = pulumi.Resource & {
  metadata: Output<
    | {
        name?: Input<string> | undefined
        namespace?: Input<string> | undefined
      }
    | undefined
  >
}

export interface ResolvedRef {
  /**
   * The name of the resource being referenced.
   */
  name: string

  /**
   * The namespace of the resource being referenced.
   * May be undefined if the resource is not in a namespace.
   */
  namespace?: string
}

export type Ref = FullRef | ReferencedResource

export function resolveRef(ref: Ref): Output<ResolvedRef> {
  if (pulumi.Resource.isInstance(ref)) {
    return all([
      //
      ref.metadata.apply(m => m!.name!),
      ref.metadata.apply(m => m!.namespace),
    ]).apply(([name, namespace]) => {
      return {
        name,
        namespace,
      }
    })
  }

  return all([ref.name, ref.namespace]).apply(([name, namespace]) => ({
    name,
    namespace,
  }))
}

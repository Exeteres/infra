import { pulumi } from "@infra/core"

interface Metadata {
  name?: pulumi.Input<string | string>
  namespace?: pulumi.Input<string | undefined>
}

export type Resource = pulumi.CustomResource & {
  metadata: pulumi.Output<Metadata | undefined | null>
}

/**
 * Exports the given resource for use in other stacks.
 *
 * @param resource The resource to export.
 * @returns The serialized resource.
 */
function _export(resource: pulumi.Input<Resource>): pulumi.Output<string> {
  const outResource = pulumi.output(resource)

  const metadata = pulumi.output(outResource.metadata).apply(metadata => {
    if (!metadata) {
      throw new Error("Resource metadata is required")
    }

    return metadata
  })

  return pulumi.all([metadata.name, metadata.namespace]).apply(([name, namespace]) => {
    if (!name) {
      throw new Error("Resource name is required")
    }

    if (!namespace) {
      return name
    }

    return `${namespace}/${name}`
  })
}

type ResourceType<T extends Resource> = {
  get: (name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions) => T
}

/**
 * Imports the resource with the given name from the given stack.
 *
 * @param stack The stack to import from.
 * @param type The type of the resource.
 * @param idOutputName The name of the output that contains the resource ID.
 * @returns The imported resource.
 */
function _import<T extends Resource>(
  stack: pulumi.StackReference,
  type: ResourceType<T>,
  idOutputName: string,
): pulumi.Output<T> {
  const value = stack.requireOutput(idOutputName)

  return pulumi.output(value).apply(id => type.get(id, id))
}

export { _export as export, _import as import }

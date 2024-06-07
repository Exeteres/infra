import { CustomResourceOptions, all, output } from "@pulumi/pulumi"
import { pulumi } from "./imports"

export interface CommonOptions {
  /**
   * The name of the resource.
   * Must be unique for the given type in the given stack.
   */
  name: string

  /**
   * The parent resource.
   */
  parent?: pulumi.Resource

  /**
   * The dependencies of the resource.
   */
  dependsOn?: pulumi.Input<pulumi.Input<pulumi.Resource>[]> | pulumi.Input<pulumi.Resource>

  /**
   * The Pulumi resource options.
   */
  resourceOptions?: CustomResourceOptions
}

/**
 * Maps the given options to Pulumi options for a resource.
 *
 * @param options The options.
 * @param extra Additional options to add.
 * @returns The Pulumi options.
 */
export function mapPulumiOptions<TOptions extends Partial<CommonOptions>>(
  options: TOptions,
  extra?: pulumi.CustomResourceOptions,
): pulumi.CustomResourceOptions {
  return {
    parent: options.parent,
    dependsOn: options.dependsOn,
    ...options.resourceOptions,
    ...extra,
  }
}

/**
 * Exports the given item to a JSON-serializable format which can be used in Pulumi outputs.
 *
 * @param item The item to export.
 * @returns The exported item.
 */
function _export(item: unknown): unknown {
  switch (typeof item) {
    case "object": {
      if (item === null) {
        return null
      }

      if (Array.isArray(item)) {
        return item.map(_export)
      }

      if (pulumi.Resource.isInstance(item)) {
        return item.urn
      }

      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(item)) {
        result[key] = _export(value)
      }
      return result
    }
    case "function": {
      throw new Error("Cannot export functions")
    }
    case "symbol": {
      throw new Error("Cannot export symbols")
    }
    default: {
      return item
    }
  }
}

type ResourceType = {
  get: (name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions) => pulumi.Resource
}

const _typeMap = new Map<string, ResourceType>()

export function registerType(type: string, resource: ResourceType): void {
  _typeMap.set(type, resource)
}

function _importItem(item: unknown): unknown {
  switch (typeof item) {
    case "object": {
      if (item === null) {
        return null
      }

      if (Array.isArray(item)) {
        return item.map(_importItem)
      }

      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(item)) {
        result[key] = _importItem(value)
      }
      return result
    }
    case "string": {
      if (item.startsWith("urn:pulumi:")) {
        const [, , type, name] = item.split("::")
        const resource = _typeMap.get(type)

        if (resource === undefined) {
          throw new Error(`Resource type "${type}" not found`)
        }

        return resource.get(name, name)
      }

      return item
    }
    default: {
      return item
    }
  }
}

function _import<T>(stack: pulumi.StackReference, name: string): pulumi.Output<T> {
  const value = stack.getOutput(name)

  return all([value, stack.name]).apply(([value, stackName]) => {
    if (value === undefined) {
      throw new Error(`Output "${name}" not found in stack "${stackName}"`)
    }

    return _importItem(value) as T
  })
}

export { _export as export, _import as import }

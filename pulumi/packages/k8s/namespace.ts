import { raw } from "./imports"
import { CommonOptions } from "./options"

export interface NamespaceOptions extends Omit<CommonOptions, "namespace"> {}

/**
 * Create a new namespace in the cluster.
 *
 * @param options The namespace options.
 * @returns The namespace resource.
 */
export function createNamespace(options: NamespaceOptions) {
  return new raw.core.v1.Namespace(options.name, {
    metadata: {
      name: options.name,
      labels: options.labels,
      annotations: options.annotations,
    },
  })
}

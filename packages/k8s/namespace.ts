import { k8s } from "./imports"
import { CommonOptions } from "./options"

interface NamespaceOptions extends Omit<CommonOptions, "namespace"> {}

/**
 * Create a new namespace in the cluster.
 *
 * @param options The namespace options.
 * @returns The namespace resource.
 */
export function createNamespace(options: NamespaceOptions) {
  return new k8s.core.v1.Namespace(options.name, {
    metadata: {
      labels: options.labels,
      annotations: options.annotations,
    },
  })
}

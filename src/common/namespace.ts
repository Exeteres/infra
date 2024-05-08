import * as k8s from "@pulumi/kubernetes"
import { Config } from "@pulumi/pulumi"

interface NamespaceOptions {
  name: string
  labels?: Record<string, string>
}

export const createNamespace = (options: NamespaceOptions) => {
  const namespace = new k8s.core.v1.Namespace(options.name, {
    metadata: {
      name: options.name,
      labels: options.labels,
    },
  })

  const config = new Config(options.name)

  return { namespace, config }
}

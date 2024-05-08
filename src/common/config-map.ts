import * as k8s from "@pulumi/kubernetes"
import { Input } from "@pulumi/pulumi"

interface ConfigMapOptions {
  name: string
  namespace: k8s.core.v1.Namespace

  key: string
  value: Input<string>
}

export const createConfigMap = ({ name, namespace, key, value }: ConfigMapOptions) => {
  return new k8s.core.v1.ConfigMap(
    name,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
      },
      data: {
        [key]: value,
      },
    },
    { parent: namespace },
  )
}

import { Input } from "@pulumi/pulumi"
import * as k8s from "@pulumi/kubernetes"

type SecretOptions = {
  name: string
  namespace: k8s.core.v1.Namespace
} & (
  | {
      key?: string
      value: Input<string>
      data?: never
    }
  | {
      data: Record<string, Input<string>>
    }
)

export const createSecret = (options: SecretOptions) => {
  return new k8s.core.v1.Secret(
    options.name,
    {
      metadata: { name: options.name, namespace: options.namespace.metadata.name },
      stringData: "key" in options ? { [options.key ?? "value"]: options.value } : options.data,
    },
    { parent: options.namespace },
  )
}

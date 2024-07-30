import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { knative } from "@infra/knative"

type VariableValue = string | { secret: string }

interface EnvironmentVariable {
  name: string
  environment: Record<string, VariableValue>
}

const namespace = k8s.createNamespace({ name: "functions" })

const config = new pulumi.Config("functions")
const functions = config.getObject<EnvironmentVariable[]>("functions") ?? []

for (const fn of functions) {
  const configMapEnvironment: Record<string, string> = {}
  const secretEnvironment: Record<string, pulumi.Input<string>> = {}

  for (const [key, value] of Object.entries(fn.environment)) {
    if (typeof value === "string") {
      configMapEnvironment[key] = String(value)
    } else {
      secretEnvironment[key] = config.requireSecret(value.secret)
    }
  }

  const environmentSources: k8s.ContainerEnvironmentSource[] = []

  if (Object.keys(configMapEnvironment).length > 0) {
    const configMap = k8s.createConfigMap({
      name: `${fn.name}-environment`,
      namespace,
      data: configMapEnvironment,
    })

    environmentSources.push(configMap)
  }

  if (Object.keys(secretEnvironment).length > 0) {
    const secret = k8s.createSecret({
      name: `${fn.name}-environment`,
      namespace,
      data: secretEnvironment,
    })

    environmentSources.push(secret)
  }
}

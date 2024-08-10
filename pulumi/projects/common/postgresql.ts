import { pulumi } from "@infra/core"
import { memoize, singleton } from "./utils"
import { resolveStack } from "./stack"
import { scripting } from "@infra/scripting"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"

interface PostgresqlEnvironment {
  service: pulumi.Output<k8s.raw.core.v1.Service>
  host: pulumi.Output<string>
  rootPassword: pulumi.Output<string>
}

export const getPostgresqlEnvironment = singleton((): PostgresqlEnvironment => {
  const stack = resolveStack("postgresql")

  return {
    service: k8s.import(stack, k8s.raw.core.v1.Service, "serviceId"),
    host: stack.requireOutput("host") as pulumi.Output<string>,
    rootPassword: stack.requireOutput("rootPassword") as pulumi.Output<string>,
  }
})

export const getPostgresqlScriptingBundle = memoize((namespace: k8s.raw.core.v1.Namespace) => {
  return scripting.createBundle({
    name: "postgresql",
    namespace,
    environment: postgresql.scriptEnvironment,
  })
})

export function createPostgresqlDatabase(
  name: string,
  namespace: k8s.raw.core.v1.Namespace,
  databasePassword?: pulumi.Input<string>,
) {
  const bundle = getPostgresqlScriptingBundle(namespace)
  const { service, rootPassword } = getPostgresqlEnvironment()

  return postgresql.createDatabase({
    name,
    namespace,

    service,
    bundle,
    password: databasePassword,

    rootPasswordSecret: k8s.createSecret({
      name: "postgres-root-password",
      namespace,

      key: "postgres-password",
      value: rootPassword,
    }),
  })
}

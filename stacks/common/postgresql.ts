import { pulumi } from "@infra/core"
import { memoize, singleton } from "./utils"
import { resolveStack } from "./stack"
import { scripting } from "@infra/scripting"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"

interface PostgresqlEnvironment {
  host: pulumi.Output<string>
  port: pulumi.Output<number>
  rootPassword: pulumi.Output<string>
}

export const getPostgresqlEnvironment = singleton((): PostgresqlEnvironment => {
  const stack = resolveStack("postgresql")

  return {
    host: stack.requireOutput("host") as pulumi.Output<string>,
    port: stack.requireOutput("port") as pulumi.Output<number>,
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
  const { host, port, rootPassword } = getPostgresqlEnvironment()

  return postgresql.createDatabase({
    name,
    namespace,

    host,
    port: pulumi.interpolate`${port}`,
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

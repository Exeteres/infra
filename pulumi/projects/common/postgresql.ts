import { pulumi } from "@infra/core"
import { singleton } from "./utils"
import { getStack } from "./stack"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { scripting } from "@infra/scripting"
import { cilium } from "@infra/cilium"
import { createAllowAlpineRegistryPolicy } from "./cilium"

interface PostgresqlEnvironment {
  service: pulumi.Output<k8s.raw.core.v1.Service>
  host: pulumi.Output<string>
  rootPassword: pulumi.Output<string>
}

export const getPostgresqlEnvironment = singleton((): PostgresqlEnvironment => {
  const stack = getStack("postgresql")

  return {
    service: k8s.import(stack, k8s.raw.core.v1.Service, "serviceId"),
    host: stack.requireOutput("host") as pulumi.Output<string>,
    rootPassword: stack.requireOutput("rootPassword") as pulumi.Output<string>,
  }
})

export function createPostgresqlDatabase(
  name: string,
  namespace: k8s.raw.core.v1.Namespace,
  databasePassword: pulumi.Input<string>,
) {
  const { rootPassword, service } = getPostgresqlEnvironment()

  const environment = postgresql.createScriptingEnvironment({
    rootPasswordSecret: k8s.createSecret({
      name: "postgresql-root-password",
      namespace,

      key: "postgres-password",
      value: rootPassword,
    }),
  })

  const bundle = scripting.createBundle({
    name: "database",
    namespace,

    environment,
  })

  createAllowAlpineRegistryPolicy(namespace)

  cilium.createAllowServicePolicy({
    name: "allow-postgresql",
    namespace,

    description: "Allow access to the PostgreSQL database",

    service,
  })

  return postgresql.createDatabase({
    name,
    namespace,

    service,
    bundle,
    password: databasePassword,
  })
}

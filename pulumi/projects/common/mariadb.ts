import { pulumi } from "@infra/core"
import { singleton } from "./utils"
import { getStack } from "./stack"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { scripting } from "@infra/scripting"

interface MariadbEnvironment {
  service: pulumi.Output<k8s.raw.core.v1.Service>
  host: pulumi.Output<string>
  rootPassword: pulumi.Output<string>
}

export const getMariadbEnvironment = singleton((): MariadbEnvironment => {
  const stack = getStack("mariadb")

  return {
    service: k8s.import(stack, k8s.raw.core.v1.Service, "serviceId"),
    host: stack.requireOutput("host") as pulumi.Output<string>,
    rootPassword: stack.requireOutput("rootPassword") as pulumi.Output<string>,
  }
})

export function createMariadbDatabase(
  name: string,
  namespace: k8s.raw.core.v1.Namespace,
  databasePassword: pulumi.Input<string>,
) {
  const { rootPassword, service } = getMariadbEnvironment()

  const environment = mariadb.createScriptingEnvironment({
    rootPasswordSecret: k8s.createSecret({
      name: "mariadb-root-password",
      namespace,

      key: "mariadb-root-password",
      value: rootPassword,
    }),
  })

  const bundle = scripting.createBundle({
    name: "database",
    namespace,

    environment,
  })

  return mariadb.createDatabase({
    name,
    namespace,

    service,
    bundle,
    password: databasePassword,
  })
}

import { pulumi } from "@infra/core"
import { memoize, singleton } from "./utils"
import { resolveStack } from "./stack"
import { scripting } from "@infra/scripting"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"

interface MariadbEnvironment {
  host: pulumi.Output<string>
  port: pulumi.Output<number>
  rootPassword: pulumi.Output<string>
}

export const getMariadbEnvironment = singleton((): MariadbEnvironment => {
  const stack = resolveStack("mariadb")

  return {
    host: stack.requireOutput("host") as pulumi.Output<string>,
    port: stack.requireOutput("port") as pulumi.Output<number>,
    rootPassword: stack.requireOutput("rootPassword") as pulumi.Output<string>,
  }
})

export const getMariadbScriptingBundle = memoize((namespace: k8s.raw.core.v1.Namespace) => {
  return scripting.createBundle({
    name: "mariadb",
    namespace,
    environment: mariadb.scriptEnvironment,
  })
})

export function createMariadbDatabase(
  name: string,
  namespace: k8s.raw.core.v1.Namespace,
  databasePassword?: pulumi.Input<string>,
) {
  const bundle = getMariadbScriptingBundle(namespace)
  const { host, port, rootPassword } = getMariadbEnvironment()

  return mariadb.createDatabase({
    name,
    namespace,

    host,
    port: pulumi.interpolate`${port}`,
    bundle,
    password: databasePassword,

    rootPasswordSecret: k8s.createSecret({
      name: "mariadb-root-password",
      namespace,

      key: "mariadb-root-password",
      value: rootPassword,
    }),
  })
}

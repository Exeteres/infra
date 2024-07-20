import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { createBackupRepository } from "@stacks/common"

const namespace = k8s.createNamespace({ name: "mariadb" })

const config = new pulumi.Config("mariadb")
const rootPassword = config.requireSecret("rootPassword")
const backupPassword = config.requireSecret("backupPassword")

const { backup } = createBackupRepository("mariadb", namespace, backupPassword)

const { release } = mariadb.createApplication({
  namespace,

  backup,
  rootPassword,
})

const host = pulumi.interpolate`${release.name}.${namespace.metadata.name}`
const port = 3306

export { host, port, rootPassword }

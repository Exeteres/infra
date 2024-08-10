import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { createBackupRepository } from "@projects/common"

const namespace = k8s.createNamespace({ name: "mariadb" })

const config = new pulumi.Config("mariadb")
const rootPassword = config.requireSecret("rootPassword")
const backupPassword = config.requireSecret("backupPassword")

const { backup } = createBackupRepository("mariadb", namespace, backupPassword)

const { service, host } = mariadb.createApplication({
  namespace,

  backup,
  rootPassword,
})

export const serviceId = k8s.export(service)
export { rootPassword, host }

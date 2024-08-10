import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { createBackupRepository } from "@projects/common"

const namespace = k8s.createNamespace({ name: "postgresql" })

const config = new pulumi.Config("postgresql")
const rootPassword = config.requireSecret("rootPassword")
const backupPassword = config.requireSecret("backupPassword")

const { backup } = createBackupRepository("postgresql", namespace, backupPassword)

const { service, host } = postgresql.createApplication({
  namespace,

  backup,
  rootPassword,
})

export const serviceId = k8s.export(service)
export { rootPassword, host }

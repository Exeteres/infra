import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { createBackupRepository } from "@stacks/common"

const namespace = k8s.createNamespace({ name: "postgresql" })

const config = new pulumi.Config("postgresql")
const rootPassword = config.requireSecret("rootPassword")
const backupPassword = config.requireSecret("backupPassword")

const { backup } = createBackupRepository("postgresql", namespace, backupPassword)

const { release } = postgresql.createApplication({
  namespace,

  backup,
  rootPassword,
})

const host = pulumi.interpolate`${release.name}.${namespace.metadata.name}`
const port = 5432

export { host, port, rootPassword }

import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { etebase } from "@infra/etebase"
import { createBackupRepository, createPostgresqlDatabase, exposeInternalService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "etebase" })

const config = new pulumi.Config("etebase")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")
const backupPassword = config.requireSecret("backupPassword")

const { gateway } = exposeInternalService(namespace, domain)
const { credentials } = createPostgresqlDatabase("etebase", namespace, databasePassword)
const { backup } = createBackupRepository("etebase", namespace, backupPassword)

etebase.createApplication({
  namespace,
  domain,

  gateway,
  databaseCredentials: credentials,
  backup,
})

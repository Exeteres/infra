import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { ghost } from "@infra/ghost"
import { createBackupRepository, createMariadbDatabase, exposePublicService } from "@stacks/common"

const namespace = k8s.createNamespace({ name: "ghost" })

const config = new pulumi.Config("ghost")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")
const backupPassword = config.requireSecret("backupPassword")

const { gateway } = exposePublicService(namespace, domain)
const { credentials } = createMariadbDatabase("ghost", namespace, databasePassword)
const { backup } = createBackupRepository("ghost", namespace, backupPassword)

ghost.createApplication({
  namespace,
  domain,

  gateway,
  databaseCredentials: credentials,

  backup,
})

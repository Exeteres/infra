import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { ghost } from "@infra/ghost"
import { createBackupRepository, createMariadbDatabase, exposePublicService } from "@stacks/common"

const namespace = k8s.createNamespace({ name: "ghost-ru" })

const config = new pulumi.Config("ghost-ru")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")
const backupPassword = config.requireSecret("backupPassword")
const smtpHost = config.require("smtpHost")
const smtpPort = config.requireNumber("smtpPort")
const smtpUsername = config.require("smtpUsername")
const smtpPassword = config.requireSecret("smtpPassword")
const smtpFrom = config.require("smtpFrom")

const { gateway } = exposePublicService(namespace, domain)
const { credentials } = createMariadbDatabase("ghost-ru", namespace, databasePassword)
const { backup } = createBackupRepository("ghost-ru", namespace, backupPassword)

ghost.createApplication({
  namespace,
  domain,

  gateway,
  databaseCredentials: credentials,

  backup,

  smtpCredentials: {
    host: smtpHost,
    port: smtpPort,
    username: smtpUsername,
    password: smtpPassword,
    from: smtpFrom,
  },
})

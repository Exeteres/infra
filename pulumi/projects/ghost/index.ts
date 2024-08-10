import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { ghost } from "@infra/ghost"
import { createBackupRepository, createMariadbDatabase, exposePublicService } from "@projects/common"

const config = new pulumi.Config()
const name = config.require("name")

const namespace = k8s.createNamespace({ name })

const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")
const backupPassword = config.requireSecret("backupPassword")
const smtpHost = config.require("smtpHost")
const smtpPort = config.requireNumber("smtpPort")
const smtpUsername = config.require("smtpUsername")
const smtpPassword = config.requireSecret("smtpPassword")
const smtpFrom = config.require("smtpFrom")

const { gateway } = exposePublicService(namespace, domain)
const { credentials } = createMariadbDatabase(name, namespace, databasePassword)
const { backup } = createBackupRepository(name, namespace, backupPassword)

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

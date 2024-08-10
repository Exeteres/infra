import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { standardnotes } from "@infra/standardnotes"
import { createBackupRepository, createMariadbDatabase, exposeInternalService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "standardnotes" })

const config = new pulumi.Config("standardnotes")
const domain = config.require("domain")
const filesDomain = config.require("filesDomain")
const databasePassword = config.requireSecret("databasePassword")
const backupPassword = config.requireSecret("backupPassword")

const encryptionServerKey = config.requireSecret("encryptionServerKey")
const authSecretKey = config.requireSecret("authSecretKey")
const valetTokenSecret = config.requireSecret("valetTokenSecret")

const { gateway } = exposeInternalService(namespace, domain)
const { gateway: filesGateway } = exposeInternalService(namespace, filesDomain)
const { credentials } = createMariadbDatabase("standardnotes", namespace, databasePassword)
const { repository } = createBackupRepository("standardnotes", namespace, backupPassword)

standardnotes.createApplication({
  namespace,
  domain,
  filesDomain,

  gateway,
  filesGateway,

  databaseCredentials: credentials,

  uploadsBackup: {
    repository,
    hostname: "standardnotes-uploads",
  },

  encryptionServerKey,
  authSecretKey,
  valetTokenSecret,
})

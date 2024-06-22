import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"
import { standardnotes } from "@infra/standardnotes"

const sharedStack = new pulumi.StackReference("organization/shared/main")
const mariadbStack = new pulumi.StackReference("organization/mariadb/main")

const config = new pulumi.Config("standardnotes")

const domain = config.require("domain")
const filesDomain = config.require("filesDomain")
const hostname = config.require("hostname")
const filesHostname = config.require("filesHostname")
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")
const databasePassword = config.requireSecret("databasePassword")
const backupPassword = config.requireSecret("backupPassword")
const rcloneConfig = sharedStack.requireOutput("rcloneConfig")
const mariadbRootPassword = mariadbStack.requireOutput("rootPassword")

const encryptionServerKey = config.requireSecret("encryptionServerKey")
const authSecretKey = config.requireSecret("authSecretKey")
const valetTokenSecret = config.requireSecret("valetTokenSecret")

const namespace = k8s.createNamespace({ name: "standardnotes" })

const mariadbRootPasswordSecret = k8s.createSecret({
  name: "mariadb-root-password",
  namespace,

  key: "mariadb-root-password",
  value: mariadbRootPassword,
})

const bundle = scripting.createBundle({
  name: "standardnotes-mariadb",
  namespace,
  environment: mariadb.scriptEnvironment,
})

const { initContainer, secret, volumes } = mariadb.createDatabase({
  name: "standardnotes",
  namespace,

  host: "mariadb.mariadb",
  bundle,
  password: databasePassword,

  rootPasswordSecret: mariadbRootPasswordSecret,
})

const backupRepository = restic.createRepository({
  name: "standardnotes",
  namespace,

  remotePath: "rclone:backup:standardnotes",
  password: backupPassword,

  environment: restic.createRcloneEnvironment({
    namespace,
    rcloneConfig,
  }),
})

standardnotes.createApplication({
  namespace,
  domain,
  filesDomain,

  ingresses: {
    server: {
      className: "tailscale",

      tls: {
        hosts: [hostname],
      },
    },
    files: {
      className: "tailscale",

      tls: {
        hosts: [filesHostname],
      },
    },
  },

  databaseSecret: secret,
  nodeSelector,
  initContainers: [initContainer],
  volumes,

  uploadsBackup: {
    repository: backupRepository,
    hostname: "standardnotes-uploads",
  },

  encryptionServerKey,
  authSecretKey,
  valetTokenSecret,
})

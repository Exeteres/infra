import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { restic } from "@infra/restic"

const config = new pulumi.Config("mariadb")

const backupPassword = config.requireSecret("backupPassword")
const rcloneConfig = config.requireSecret("rcloneConfig")

const namespace = k8s.createNamespace({ name: "mariadb" })

const backupRepository = restic.createRepository({
  name: "mariadb",
  namespace,

  remotePath: "rclone:backup:mariadb",
  password: backupPassword,

  environment: restic.createRcloneEnvironment({
    namespace,
    rcloneConfig,
  }),
})

const { rootPasswordSecret } = mariadb.createApplication({
  namespace,

  backup: {
    repository: backupRepository,
    hostname: "mariadb",
  },

  releaseOptions: {
    values: {},
  },

  nodeSelector: k8s.mapHostnameToNodeSelector("public-spb"),
})

export const rootPassword = rootPasswordSecret.stringData["mariadb-root-password"]

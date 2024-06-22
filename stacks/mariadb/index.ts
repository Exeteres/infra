import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { restic } from "@infra/restic"

const sharedStack = new pulumi.StackReference("organization/shared/main")

const config = new pulumi.Config("mariadb")

const rootPassword = config.requireSecret("rootPassword")
const backupPassword = config.requireSecret("backupPassword")
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")
const rcloneConfig = sharedStack.requireOutput("rcloneConfig")

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

mariadb.createApplication({
  namespace,

  backup: {
    repository: backupRepository,
    hostname: "mariadb",
  },

  rootPassword,
  nodeSelector,
})

export { rootPassword }

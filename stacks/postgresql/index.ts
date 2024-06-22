import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { restic } from "@infra/restic"

const sharedStack = new pulumi.StackReference("organization/shared/main")

const config = new pulumi.Config("postgresql")

const rootPassword = config.requireSecret("rootPassword")
const backupPassword = config.requireSecret("backupPassword")
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")
const rcloneConfig = sharedStack.requireOutput("rcloneConfig")

const namespace = k8s.createNamespace({ name: "postgresql" })

const backupRepository = restic.createRepository({
  name: "postgresql",
  namespace,

  remotePath: "rclone:backup:postgresql",
  password: backupPassword,

  environment: restic.createRcloneEnvironment({
    namespace,
    rcloneConfig,
  }),
})

postgresql.createApplication({
  namespace,

  backup: {
    repository: backupRepository,
    hostname: "postgresql",
  },

  rootPassword,
  nodeSelector,
})

export { rootPassword }

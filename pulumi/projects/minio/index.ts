import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { minio } from "@infra/minio"
import { restic } from "@infra/restic"
import { exposeInternalService, resolveStack } from "@projects/common"

const namespace = k8s.createNamespace({ name: "minio" })

const config = new pulumi.Config("minio")
const rootPassword = config.requireSecret("rootPassword")
const backupPassword = config.requireSecret("backupPassword")
const domain = config.require("domain")
const consoleDomain = config.require("consoleDomain")

const sharedStack = resolveStack("shared")
const rcloneConfig = sharedStack.requireOutput("rcloneConfig")

const backupRepository = restic.createRepository({
  name: "minio",
  namespace,

  remotePath: "rclone:backup:minio",
  password: backupPassword,

  environment: restic.createRcloneEnvironment({
    namespace,
    rcloneConfig,
  }),
})

const { gateway } = exposeInternalService(namespace, domain)
const { gateway: consoleGateway } = exposeInternalService(namespace, consoleDomain)

minio.createApplication({
  namespace,

  backup: {
    repository: backupRepository,
    hostname: "minio",
  },

  rootPassword,

  gateway,
  consoleGateway,
})

export { rootPassword }

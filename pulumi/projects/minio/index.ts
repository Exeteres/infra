import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { minio } from "@infra/minio"
import { createBackupBundle, exposeInternalHttpService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "minio" })

const config = new pulumi.Config("minio")
const rootPassword = config.requireSecret("rootPassword")
const domain = config.require("domain")
const consoleDomain = config.require("consoleDomain")

const { gateway } = exposeInternalHttpService({ namespace, domain })
const { gateway: consoleGateway } = exposeInternalHttpService({ namespace, domain: consoleDomain })

const { backup } = createBackupBundle("minio", namespace)

minio.createApplication({
  namespace,

  backup,
  rootPassword,

  gateway,
  consoleGateway,
})

export { rootPassword }

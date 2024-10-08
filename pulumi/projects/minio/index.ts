import { cilium } from "@infra/cilium"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { minio } from "@infra/minio"
import { createBackupBundle, exposeInternalHttpService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "minio" })

const config = new pulumi.Config("minio")
const rootPassword = config.requireSecret("rootPassword")
const domain = config.require("domain")
const consoleDomain = config.require("consoleDomain")

const { routes } = exposeInternalHttpService({ namespace, domain })
const { routes: consoleRoutes } = exposeInternalHttpService({ namespace, domain: consoleDomain })

const { backup } = createBackupBundle("minio", namespace)

minio.createApplication({
  namespace,

  backup,
  rootPassword,

  routes,
  consoleRoutes,
})

cilium.createAllowFromNamespacesPolicy({ namespace })

export { rootPassword }

import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { sftpgo } from "@infra/sftpgo"
import { createBackupBundle, exposeInternalHttpService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "sftpgo" })

const config = new pulumi.Config("sftpgo")
const domain = config.require("domain")

const { routes } = exposeInternalHttpService({ namespace, domain })
const { backup } = createBackupBundle("sftpgo", namespace)

sftpgo.createApplication({
  namespace,
  routes,
  data: {
    backup,
  },
})

import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { createBackupBundle, createDnsRecord } from "@projects/common"

const namespace = k8s.createNamespace({ name: "mariadb" })

const config = new pulumi.Config("mariadb")
const domain = config.require("domain")
const rootPassword = config.requireSecret("rootPassword")

const { backup } = createBackupBundle("mariadb", namespace)

const { service, host } = mariadb.createApplication({
  namespace,

  backup,
  rootPassword,
})

createDnsRecord({
  name: domain,
  type: "A",
  value: service.spec.clusterIP,
})

export const serviceId = k8s.export(service)
export { rootPassword, host }

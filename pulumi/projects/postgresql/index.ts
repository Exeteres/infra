import { cilium } from "@infra/cilium"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { createBackupBundle, createDnsRecord } from "@projects/common"

const namespace = k8s.createNamespace({ name: "postgresql" })

const config = new pulumi.Config("postgresql")
const domain = config.require("domain")
const rootPassword = config.requireSecret("rootPassword")

const { backup } = createBackupBundle("postgresql", namespace)

const { service, host } = postgresql.createApplication({
  namespace,

  backup,
  rootPassword,
})

createDnsRecord({
  name: domain,
  type: "A",
  value: service.spec.clusterIP,
})

cilium.createAllowFromNamespacesPolicy({ namespace })

export const serviceId = k8s.export(service)
export { rootPassword, host }

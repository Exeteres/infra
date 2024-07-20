import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { zitadel } from "@infra/zitadel"
import { exposePublicService, getPostgresqlEnvironment } from "@stacks/common"

const namespace = k8s.createNamespace({ name: "zitadel" })

const config = new pulumi.Config("zitadel")
const domain = config.require("domain")
const databasePassword = config.getSecret("databasePassword")
const masterKey = config.getSecret("masterKey")

const { host, rootPassword } = getPostgresqlEnvironment()
const { gateway } = exposePublicService(namespace, domain)

zitadel.createApplication({
  namespace,
  domain,

  gateway,

  databaseHost: host,
  databasePassword,
  postgresRootPassword: rootPassword,
  masterKey,
})

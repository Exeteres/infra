import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { etebase } from "@infra/etebase"
import { createBackupBundle, createPostgresqlDatabase, exposeInternalHttpService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "etebase" })

const config = new pulumi.Config("etebase")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")

const { routes } = exposeInternalHttpService({ namespace, domain })
const { credentials } = createPostgresqlDatabase("etebase", namespace, databasePassword)
const { backup } = createBackupBundle("etebase", namespace)

etebase.createApplication({
  namespace,
  domain,

  routes,
  databaseCredentials: credentials,
  backup,
})

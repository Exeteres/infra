import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { attic } from "@infra/attic"
import { createPostgresqlDatabase, exposePublicService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "attic" })

const config = new pulumi.Config("attic")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")

const { gateway } = exposePublicService(namespace, domain)
const { credentials } = createPostgresqlDatabase("attic", namespace, databasePassword)

attic.createApplication({
  namespace,

  gateway,
  databaseCredentials: credentials,
})

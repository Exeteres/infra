import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { vaultwarden } from "@infra/vaultwarden"
import { createMariadbDatabase, exposeInternalService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "vaultwarden" })

const config = new pulumi.Config("vaultwarden")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")

const { gateway } = exposeInternalService(namespace, domain)
const { credentials } = createMariadbDatabase("vaultwarden", namespace, databasePassword)

vaultwarden.createApplication({
  namespace,
  domain,

  gateway,
  databaseCredentials: credentials,
})

import { cilium } from "@infra/cilium"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { n8n } from "@infra/n8n"
import {
  createBackupBundle,
  createPostgresqlDatabase,
  exposeInternalHttpService,
  exposePublicHttpService,
  getInternalGatewayService,
} from "@projects/common"

const namespace = k8s.createNamespace({ name: "n8n" })

const config = new pulumi.Config("n8n")
const domain = config.require("domain")
const publicDomain = config.require("publicDomain")
const databasePassword = config.requireSecret("databasePassword")

const { routes } = exposeInternalHttpService({ namespace, domain })
const { routes: publicRoutes } = exposePublicHttpService({ namespace, domain: publicDomain })
const { backup } = createBackupBundle("n8n", namespace)
const { credentials } = createPostgresqlDatabase("n8n", namespace, databasePassword)

n8n.createApplication({
  namespace,

  publicDomain,
  routes,
  publicRoutes,
  databaseCredentials: credentials,

  data: {
    backup,
  },
})

cilium.createAllowWebPolicy({
  name: "allow-integrations",
  namespace,

  description: "Allow access to external services for integrations",

  domains: [
    // Telegram Bot API
    "api.telegram.org",
  ],
})

cilium.createAllowServicePolicy({
  name: "allow-internal-gateway",
  namespace,

  description: "Allow access to the internal services",
  service: getInternalGatewayService(),
})

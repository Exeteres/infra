import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { ghost } from "../../apps/ghost"
import { createBackupBundle, createMariadbDatabase, getPublicGatewayService, resolveStack } from "@projects/common"
import { gw } from "@infra/gateway"

const config = new pulumi.Config()
const name = config.require("name")

const namespace = k8s.createNamespace({ name, labels: { "app.kubernetes.io/name": "ghost" } })

const pathPrefix = config.get("pathPrefix")
const databasePassword = config.requireSecret("databasePassword")
const backupPassword = config.requireSecret("backupPassword")
const smtpHost = config.require("smtpHost")
const smtpPort = config.requireNumber("smtpPort")
const smtpUsername = config.require("smtpUsername")
const smtpPassword = config.requireSecret("smtpPassword")
const smtpFrom = config.require("smtpFrom")

const gatewayStack = resolveStack("ghost-gateway")
const gateway = k8s.import(gatewayStack, gw.raw.gateway.v1.Gateway, "gatewayId")
const domain = gatewayStack.getOutput("domain") as pulumi.Output<string>

const { credentials } = createMariadbDatabase(name, namespace, databasePassword)
const { backup } = createBackupBundle(name, namespace, backupPassword)

ghost.createApplication({
  namespace,
  domain,

  gateway: {
    gateway,
    service: getPublicGatewayService(),
    pathPrefix,
  },

  databaseCredentials: credentials,

  backup,

  smtpCredentials: {
    host: smtpHost,
    port: smtpPort,
    username: smtpUsername,
    password: smtpPassword,
    from: smtpFrom,
  },
})

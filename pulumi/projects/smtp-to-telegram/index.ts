import { cilium } from "@infra/cilium"
import { Output, output, pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { smtp } from "@infra/smtp"

const namespace = k8s.createNamespace({ name: "smtp-to-telegram" })
const config = new pulumi.Config()

const envSecret = k8s.createSecret({
  name: "smtp-to-telegram",
  namespace,

  key: "ST_TELEGRAM_BOT_TOKEN",
  value: config.require("botToken"),
})

const envConfig = k8s.createConfigMap({
  name: "smtp-to-telegram",
  namespace,

  key: "ST_TELEGRAM_CHAT_IDS",
  value: config.requireObject<string[]>("chatIds").join(","),
})

const { service } = k8s.createWorkloadService({
  name: "smtp-to-telegram",
  namespace,

  kind: "Deployment",
  port: 2525,

  container: {
    image: "kostyaesmukov/smtp_to_telegram@sha256:97f9d1674bfb40ef8ff0015adab7c0dbd476def37fec1f3c1f531b0de2b60b23",
    environmentSources: [envSecret, envConfig],
  },
})

cilium.createAllowFromNamespacesPolicy({ namespace })

cilium.createAllowWebPolicy({
  name: "allow-telegram-bot-api",
  namespace,

  description: "Allow access to Telegram Bot API",

  domain: "api.telegram.org",
})

export const serviceId = k8s.export(service)

export const smtpCredentials: Output<smtp.Credentials> = output({
  host: pulumi.interpolate`${service.metadata.name}.${service.metadata.namespace}.svc`,
  port: service.spec.ports[0].port,
  username: "",
  password: "",
  tls: false,
})

import { createZitadelApp } from "@infra/apps"
import { createConfig, createNamespace } from "@infra/core"
import { plainIssuer, publicIssuer } from "./shared"

const namespace = createNamespace({ name: "zitadel" })
const config = createConfig({ name: "zitadel" })

createZitadelApp({
  namespace,

  bootstrapIssuer: plainIssuer,
  publicIssuer: publicIssuer,

  domain: config.require("domain"),

  nodeSelector: {
    "kubernetes.io/hostname": config.require("node"),
  },
})

import { createMailuApp } from "@infra/apps"
import { createConfig, createNamespace } from "@infra/core"
import { publicIssuer } from "./shared"

const namespace = createNamespace({ name: "mailu" })
const config = createConfig({ name: "mailu" })

createMailuApp({
  namespace,

  publicIssuer: publicIssuer,
  domain: config.require("domain"),

  nodeSelector: {
    "kubernetes.io/hostname": config.require("node"),
  },
})

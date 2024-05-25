import { createNamespace } from "@infra/k8s"
import { publicIssuer } from "./shared"
import { createConfig } from "@infra/core"
import { createMailuApp } from "@infra/mailu"

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

import { createConfig } from "@infra/core"
import { plainIssuer, publicIssuer } from "./shared"
import { createNamespace } from "@infra/k8s"
import { createZitadelApp } from "@infra/zitadel"

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

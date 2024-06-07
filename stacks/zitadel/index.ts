import { pulumi } from "@infra/core"
import { plainIssuer, publicIssuer } from "./shared"
import { zitadel } from "@infra/zitadel"

const config = new pulumi.Config("zitadel")

zitadel.createApplication({
  bootstrapIssuer: plainIssuer,
  publicIssuer: publicIssuer,

  domain: config.require("domain"),

  nodeSelector: {
    "kubernetes.io/hostname": config.require("node"),
  },
})

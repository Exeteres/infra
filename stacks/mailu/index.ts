import { pulumi } from "@infra/core"
import { publicIssuer } from "./shared"
import { mailu } from "@infra/mailu"

const config = new pulumi.Config("mailu")

mailu.createApplication({
  publicIssuer,
  domain: config.require("domain"),

  nodeSelector: {
    "kubernetes.io/hostname": config.require("node"),
  },
})

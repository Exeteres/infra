import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { vaultwarden } from "@infra/vaultwarden"

const config = new pulumi.Config("vaultwarden")

const domain = config.require("domain")
const hostname = config.require("hostname")
const node = config.require("node")

vaultwarden.createApplication({
  domain,

  ingress: {
    className: "tailscale",

    tls: {
      hosts: [hostname],
    },
  },

  nodeSelector: k8s.mapHostnameToNodeSelector(node),
})

import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { radicale } from "@infra/radicale"

const config = new pulumi.Config("radicale")

const hostname = config.require("hostname")
const node = config.require("node")
const usernames = config.requireObject<string[]>("usernames")

radicale.createApplication({
  ingress: {
    className: "tailscale",

    tls: {
      hosts: [hostname],
    },
  },

  usernames,
  nodeSelector: k8s.mapHostnameToNodeSelector(node),
})

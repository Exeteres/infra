import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { nixServe } from "@infra/nix-serve"

const config = new pulumi.Config("nix-serve")

const hostname = config.require("hostname")
const node = config.require("node")

nixServe.createApplication({
  ingress: {
    className: "tailscale",

    tls: {
      hosts: [hostname],
    },
  },

  nodeSelector: k8s.mapHostnameToNodeSelector(node),
})

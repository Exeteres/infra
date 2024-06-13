import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { syncthing } from "@infra/syncthing"

const config = new pulumi.Config("syncthing")

const hostname = config.require("hostname")
const webHostname = config.require("webHostname")
const node = config.require("node")

syncthing.createApplication({
  instanceName: node,

  ingress: {
    className: "tailscale",

    tls: {
      hosts: [webHostname],
    },
  },

  service: {
    type: "LoadBalancer",
    loadBalancerClass: "tailscale",

    annotations: {
      "tailscale.com/hostname": hostname,
    },
  },

  volumeClaims: {
    dataClaims: [
      {
        name: "default",
        capacity: "1Gi",
      },
    ],
  },

  nodeSelector: k8s.mapHostnameToNodeSelector(node),
})

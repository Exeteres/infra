import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { syncthing } from "@infra/syncthing"

const config = new pulumi.Config("syncthing")

const hostname = config.require("hostname")
const webHostname = config.require("webHostname")
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")

const namespace = k8s.createNamespace({ name: "syncthing" })

syncthing.createApplication({
  namespace,

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

  nodeSelector,
})

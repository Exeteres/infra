import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { syncthing } from "@infra/syncthing"
import { exposeInternalService } from "@stacks/common"

const config = new pulumi.Config("syncthing")
const domain = config.require("domain")
const hostname = config.require("hostname")

const namespace = k8s.createNamespace({ name: "syncthing" })

const { gateway } = exposeInternalService(namespace, domain)

syncthing.createApplication({
  namespace,

  gateway,

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
})

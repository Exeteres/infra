import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { syncthing } from "@infra/syncthing"
import { tailscale } from "@infra/tailscale"
import { exposeInternalService } from "@stacks/common"

const config = new pulumi.Config("syncthing")
const domain = config.require("domain")
const hostname = config.require("hostname")
const tailscaleAuthKey = config.requireSecret("tailscaleAuthKey")

const namespace = k8s.createNamespace({ name: "syncthing" })

const { gateway } = exposeInternalService(namespace, domain)

tailscale.createAuthSecret({
  name: "tailscale-auth",
  namespace,
  value: tailscaleAuthKey,
})

syncthing.createApplication({
  namespace,
  gateway,

  sidecarContainers: [tailscale.createContainerSpec(hostname)],

  volumeClaims: {
    dataClaims: [
      {
        name: "default",
        capacity: "1Gi",
      },
    ],
  },
})

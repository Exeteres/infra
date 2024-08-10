import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { syncthing } from "@infra/syncthing"
import { tailscale } from "@infra/tailscale"
import { exposeInternalService } from "@projects/common"

const config = new pulumi.Config("syncthing")
const domain = config.require("domain")
const hostname = config.require("hostname")
const tailscaleAuthKey = config.requireSecret("tailscaleAuthKey")

const namespace = k8s.createNamespace({ name: "syncthing" })

const { gateway } = exposeInternalService(namespace, domain)

const { container, serviceAccount } = tailscale.createContainer({
  namespace,
  authKey: tailscaleAuthKey,
  hostname,
  secretName: "tailscale",
})

syncthing.createApplication({
  namespace,
  gateway,

  sidecarContainers: [container],
  serviceAccount,

  volumeClaims: {
    dataClaims: [
      {
        name: "default",
        capacity: "1Gi",
      },
    ],
  },
})

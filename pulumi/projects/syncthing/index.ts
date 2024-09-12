import { cilium } from "@infra/cilium"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { syncthing } from "@infra/syncthing"
import { tailscale } from "@infra/tailscale"
import { createBackupBundle, exposeInternalHttpService } from "@projects/common"

const config = new pulumi.Config("syncthing")
const domain = config.require("domain")
const hostname = config.require("hostname")
const tailscaleAuthKey = config.requireSecret("tailscaleAuthKey")
const tailscaleAuthState = config.getSecret("tailscaleAuthState")

const namespace = k8s.createNamespace({ name: "syncthing" })

const { routes } = exposeInternalHttpService({ namespace, domain })
const { backup } = createBackupBundle("syncthing", namespace)

const { container, serviceAccount } = tailscale.createContainer({
  namespace,
  authKey: tailscaleAuthKey,
  authState: tailscaleAuthState,
  hostname,
  secretName: "tailscale",
})

syncthing.createApplication({
  namespace,
  routes,

  sidecarContainers: [container],
  serviceAccount,

  state: {
    backup,
  },
})

cilium.createAllowAllForNamespacePolicy({ namespace })

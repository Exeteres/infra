import { certManager } from "@infra/cert-manager"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

const sharedStack = new pulumi.StackReference("organization/shared/main")
const config = new pulumi.Config("cert-manager")

const { namespace, release } = certManager.createApplication()

const apiTokenSecret = k8s.createSecret({
  name: "cloudflare-api-token",
  namespace,

  dependsOn: release,

  key: "value",
  value: sharedStack.requireOutput("cloudflareApiToken"),
})

const _publicIssuer = certManager.createAcmeIssuer({
  name: "public",
  isClusterScoped: true,

  dependsOn: release,

  email: config.require("acmeEmail"),
  server: config.require("acmeServer"),

  solver: {
    dns01: {
      cloudflare: {
        apiTokenSecretRef: k8s.mapSecretToRef(apiTokenSecret, "value"),
      },
    },
  },
})

const _plainIssuer = certManager.createPlainIssuer({
  name: "plain",
  isClusterScoped: true,

  dependsOn: release,
})

export const publicIssuer = k8s.export(_publicIssuer)
export const plainIssuer = k8s.export(_plainIssuer)

import { certManager } from "@infra/cert-manager"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

const config = new pulumi.Config("cert-manager")

const { namespace, release } = certManager.createApplication()

const apiTokenSecret = k8s.createSecret({
  name: "cloudflare-api-token",
  namespace,

  dependsOn: release,

  key: "value",
  value: config.requireSecret("cloudflare-api-token"),
})

export const publicIssuer = certManager.createAcmeIssuer({
  name: "public",
  isClusterScoped: true,

  dependsOn: release,

  email: config.require("acme-email"),
  server: config.require("acme-server"),

  solver: {
    dns01: {
      cloudflare: {
        apiTokenSecretRef: k8s.mapSecretToRef(apiTokenSecret, "value"),
      },
    },
  },
})

export const plainIssuer = certManager.createPlainIssuer({
  name: "plain",
  isClusterScoped: true,

  dependsOn: release,
})

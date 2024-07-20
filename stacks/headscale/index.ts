import { pulumi } from "@infra/core"
import { headscale } from "@infra/headscale"
import { k8s } from "@infra/k8s"
import { createPostgresqlDatabase, exposePublicService } from "@stacks/common"

const namespace = k8s.createNamespace({ name: "headscale" })

const config = new pulumi.Config("headscale")
const domain = config.require("domain")
const vpnDomain = config.require("vpnDomain")
const databasePassword = config.getSecret("databasePassword")
const derpServerPrivateKey = config.getSecret("derpServerPrivateKey")
const noisePrivateKey = config.requireSecret("noisePrivateKey")
const publicIpV4 = config.get("publicIpV4") ?? ""
const publicIpV6 = config.get("publicIpV6") ?? ""
const oidcIssuer = config.get("oidcIssuer")
const oidcClientId = config.get("oidcClientId")
const oidcClientSecret = config.getSecret("oidcClientSecret")

const { gateway } = exposePublicService(namespace, domain)
const { credentials } = createPostgresqlDatabase("headscale", namespace, databasePassword)

headscale.createApplication({
  namespace,

  domain,
  vpnDomain,

  acl: {
    acls: [{ action: "accept", src: ["*"], dst: ["*:*"] }],
  },

  databaseCredentials: credentials,
  gateway,

  derpServerPrivateKey,
  noisePrivateKey,

  publicIpV4,
  publicIpV6,

  oidc:
    oidcIssuer && oidcClientId && oidcClientSecret
      ? {
          issuer: oidcIssuer,
          clientId: oidcClientId,
          clientSecret: oidcClientSecret,
        }
      : undefined,
})

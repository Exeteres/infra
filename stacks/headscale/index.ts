import { pulumi, resource } from "@infra/core"
import { headscale } from "@infra/headscale"
import { postgresql } from "@infra/postgresql"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"
import { cloudflare } from "@infra/cloudflare"
import { certManager } from "@infra/cert-manager"

const namespace = k8s.createNamespace({ name: "headscale" })

const config = new pulumi.Config("headscale")
const domain = config.require("domain")
const vpnDomain = config.require("vpnDomain")
const databasePassword = config.getSecret("databasePassword")
const derpServerPrivateKey = config.getSecret("derpServerPrivateKey")
const noisePrivateKey = config.requireSecret("noisePrivateKey")
const publicIpV4 = config.get("publicIpV4") ?? ""
const publicIpV6 = config.get("publicIpV6") ?? ""
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")
const oidcIssuer = config.get("oidcIssuer")
const oidcClientId = config.get("oidcClientId")
const oidcClientSecret = config.getSecret("oidcClientSecret")

const sharedStack = new pulumi.StackReference("organization/shared/main")
const cloudflareApiToken = sharedStack.requireOutput("cloudflareApiToken")
const cloudflareZoneId = sharedStack.requireOutput("cloudflareZoneId")
const nodeIpAddress = sharedStack.requireOutput("nodeIpAddress")

const cloudflareProvider = new cloudflare.raw.Provider("cloudflare", { apiToken: cloudflareApiToken })

const postgresqlStack = new pulumi.StackReference("organization/postgresql/main")
const postgresRootPassword = postgresqlStack.getOutput("rootPassword")

const certManagerStack = new pulumi.StackReference("organization/cert-manager/main")
const publicIssuer = resource.import<certManager.Issuer>(certManagerStack, "publicIssuer")

const bundle = scripting.createBundle({
  name: "headscale-postgresql",
  namespace,
  environment: postgresql.scriptEnvironment,
})

const { initContainer, secret, volumes } = postgresql.createDatabase({
  name: "headscale",
  namespace,

  host: "postgresql.postgresql",
  bundle,
  password: databasePassword,

  rootPasswordSecret: k8s.createSecret({
    name: "postgres-root-password",
    namespace,

    key: "postgres-password",
    value: postgresRootPassword,
  }),
})

cloudflare.createRecord({
  name: domain,
  type: "A",
  value: nodeIpAddress,
  zoneId: cloudflareZoneId,

  parent: namespace,
  provider: cloudflareProvider,
})

const certificateBundle = certManager.createCertificate({
  name: "headscale",
  namespace,

  issuer: publicIssuer,
  domain,
})

headscale.createApplication({
  namespace,

  domain,
  vpnDomain,

  acl: {
    acls: [{ action: "accept", src: ["*"], dst: ["*:*"] }],
  },

  databaseSecret: secret,
  initContainers: [initContainer],
  volumes,

  derpServerPrivateKey,
  noisePrivateKey,

  publicIpV4,
  publicIpV6,

  ingress: {
    rule: {
      host: domain,
    },
    tlsSecretName: certificateBundle.secretName,
  },

  nodeSelector,

  oidc:
    oidcIssuer && oidcClientId && oidcClientSecret
      ? {
          issuer: oidcIssuer,
          clientId: oidcClientId,
          clientSecret: oidcClientSecret,
        }
      : undefined,
})

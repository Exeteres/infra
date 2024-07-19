import { certManager } from "@infra/cert-manager"
import { cloudflare } from "@infra/cloudflare"
import { pulumi, resource } from "@infra/core"
import { k8s } from "@infra/k8s"
import { zitadel } from "@infra/zitadel"

const namespace = k8s.createNamespace({ name: "zitadel" })

const config = new pulumi.Config("zitadel")
const domain = config.require("domain")
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")
const databasePassword = config.getSecret("databasePassword")
const masterKey = config.getSecret("masterKey")

const postgresqlStack = new pulumi.StackReference("organization/postgresql/main")
const postgresRootPassword = postgresqlStack.getOutput("rootPassword")

const sharedStack = new pulumi.StackReference("organization/shared/main")
const cloudflareApiToken = sharedStack.requireOutput("cloudflareApiToken")
const cloudflareZoneId = sharedStack.requireOutput("cloudflareZoneId")
const nodeIpAddress = sharedStack.requireOutput("nodeIpAddress")

const cloudflareProvider = new cloudflare.raw.Provider("cloudflare", { apiToken: cloudflareApiToken })

const certManagerStack = new pulumi.StackReference("organization/cert-manager/main")
const publicIssuer = resource.import<certManager.Issuer>(certManagerStack, "publicIssuer")

cloudflare.createRecord({
  name: domain,
  type: "A",
  value: nodeIpAddress,
  zoneId: cloudflareZoneId,

  parent: namespace,
  provider: cloudflareProvider,
})

const certificateBundle = certManager.createCertificate({
  name: "zitadel",
  namespace,

  issuer: publicIssuer,
  domain,
})

zitadel.createApplication({
  namespace,
  domain,
  nodeSelector,

  databaseHost: "postgresql.postgresql",
  databasePassword,
  postgresRootPassword,
  masterKey,

  ingress: {
    rule: {
      host: domain,
    },
    tlsSecretName: certificateBundle.secretName,
  },
})

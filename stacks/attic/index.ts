import { pulumi, resource } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"
import { attic } from "@infra/attic"
import { cloudflare } from "@infra/cloudflare"
import { postgresql } from "@infra/postgresql"
import { certManager } from "@infra/cert-manager"

const sharedStack = new pulumi.StackReference("organization/shared/main")
const postgresqlStack = new pulumi.StackReference("organization/postgresql/main")
const certManagerStack = new pulumi.StackReference("organization/cert-manager/main")
const config = new pulumi.Config("attic")

const domain = config.require("domain")
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")
const databasePassword = config.requireSecret("databasePassword")
const cloudflareApiToken = sharedStack.requireOutput("cloudflareApiToken")
const cloudflareZoneId = sharedStack.requireOutput("cloudflareZoneId")
const nodeIpAddress = sharedStack.requireOutput("nodeIpAddress")

const cloudflareProvider = new cloudflare.raw.Provider("cloudflare", { apiToken: cloudflareApiToken })

const namespace = k8s.createNamespace({ name: "attic" })

const postgresRootPassword = postgresqlStack.getOutput("rootPassword")

const bundle = scripting.createBundle({
  name: "attic-postgresql",
  namespace,
  environment: postgresql.scriptEnvironment,
})

const { initContainer, secret, volumes } = postgresql.createDatabase({
  name: "attic",
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

const publicIssuer = resource.import<certManager.Issuer>(certManagerStack, "publicIssuer")

const certificateBundle = certManager.createCertificate({
  name: "attic-web",
  namespace,

  issuer: publicIssuer,
  domain,
})

attic.createApplication({
  namespace,

  ingress: {
    rule: {
      host: domain,
    },
    tlsSecretName: certificateBundle.secretName,
  },

  databaseSecret: secret,
  initContainers: [initContainer],
  volumes,

  nodeSelector,
})

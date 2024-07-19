import { pulumi, resource } from "@infra/core"
import { mailu } from "@infra/mailu"
import { k8s } from "@infra/k8s"
import { certManager } from "@infra/cert-manager"

import "@infra/cert-manager"
import { cloudflare } from "@infra/cloudflare"

const namespace = k8s.createNamespace({ name: "mailu" })

const config = new pulumi.Config("mailu")
const domain = config.require("domain")
const nodeSelector = config.getObject<k8s.NodeSelector>("nodeSelector")
const secretKey = config.getSecret("secretKey")
const adminPassword = config.getSecret("adminPassword")
const dkimPublickKey = config.get("dkimPublicKey")

const certManagerStack = new pulumi.StackReference("organization/cert-manager/main")
const publicIssuer = resource.import<certManager.Issuer>(certManagerStack, "publicIssuer")

const sharedStack = new pulumi.StackReference("organization/shared/main")
const cloudflareApiToken = sharedStack.requireOutput("cloudflareApiToken")
const cloudflareZoneId = sharedStack.requireOutput("cloudflareZoneId")
const nodeIpAddress = sharedStack.requireOutput("nodeIpAddress")

const cloudflareProvider = new cloudflare.raw.Provider("cloudflare", { apiToken: cloudflareApiToken })

cloudflare.createRecord({
  name: `mail.${domain}`,
  type: "A",
  value: nodeIpAddress,
  zoneId: cloudflareZoneId,

  parent: namespace,
  provider: cloudflareProvider,
})

cloudflare.createRecord({
  name: k8s.getPrefixedName("mx", domain),
  recordName: domain,
  type: "MX",
  value: `mail.${domain}`,
  zoneId: cloudflareZoneId,
  priority: 10,

  parent: namespace,
  provider: cloudflareProvider,
})

cloudflare.createRecord({
  name: k8s.getPrefixedName("spf", domain),
  recordName: domain,
  type: "TXT",
  value: `v=spf1 mx a:mail.${domain} ~all`,
  zoneId: cloudflareZoneId,

  parent: namespace,
  provider: cloudflareProvider,
})

cloudflare.createRecord({
  name: k8s.getPrefixedName("dmarc", domain),
  recordName: `_dmarc.${domain}`,
  type: "TXT",
  value: "v=DMARC1; p=reject; adkim=s; aspf=s",
  zoneId: cloudflareZoneId,

  parent: namespace,
  provider: cloudflareProvider,
})

cloudflare.createRecord({
  name: k8s.getPrefixedName("report", domain),
  recordName: `${domain}._report._dmarc.${domain}`,
  type: "TXT",
  value: "v=DMARC1",
  zoneId: cloudflareZoneId,

  parent: namespace,
  provider: cloudflareProvider,
})

if (dkimPublickKey) {
  cloudflare.createRecord({
    name: k8s.getPrefixedName("dkim", domain),
    recordName: `dkim._domainkey.${domain}`,
    type: "TXT",
    value: `v=DKIM1; k=rsa; p=${dkimPublickKey}`,
    zoneId: cloudflareZoneId,

    parent: namespace,
    provider: cloudflareProvider,
  })
}

mailu.createApplication({
  namespace,
  publicIssuer,
  domain,
  nodeSelector,

  secretKey,
  adminPassword,
})

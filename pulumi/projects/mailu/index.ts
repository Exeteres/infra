import { pulumi } from "@infra/core"
import { mailu } from "@infra/mailu"
import { k8s } from "@infra/k8s"

import { createBackupRepository, createDnsRecord, exposePublicService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "mailu" })

const config = new pulumi.Config("mailu")
const domain = config.require("domain")
const secretKey = config.getSecret("secretKey")
const adminPassword = config.getSecret("adminPassword")
const dkimPublickKey = config.get("dkimPublicKey")
const backupPassword = config.requireSecret("backupPassword")

const { gateway } = exposePublicService(namespace, `mail.${domain}`)
const { backup } = createBackupRepository("mailu", namespace, backupPassword)

createDnsRecord(namespace, {
  name: k8s.getPrefixedName("mx", domain),
  recordName: domain,
  type: "MX",
  value: `mail.${domain}`,
  priority: 10,
})

createDnsRecord(namespace, {
  name: k8s.getPrefixedName("spf", domain),
  recordName: domain,
  type: "TXT",
  value: `v=spf1 mx a:mail.${domain} ~all`,
})

createDnsRecord(namespace, {
  name: k8s.getPrefixedName("dmarc", domain),
  recordName: `_dmarc.${domain}`,
  type: "TXT",
  value: "v=DMARC1; p=reject; adkim=s; aspf=s",
})

createDnsRecord(namespace, {
  name: k8s.getPrefixedName("report", domain),
  recordName: `${domain}._report._dmarc.${domain}`,
  type: "TXT",
  value: "v=DMARC1",
})

if (dkimPublickKey) {
  createDnsRecord(namespace, {
    name: k8s.getPrefixedName("dkim", domain),
    recordName: `dkim._domainkey.${domain}`,
    type: "TXT",
    value: `v=DKIM1; k=rsa; p=${dkimPublickKey}`,
  })
}

mailu.createApplication({
  namespace,
  domain,

  secretKey,
  adminPassword,
  backup,
  gateway,
})

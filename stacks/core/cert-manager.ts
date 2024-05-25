import { createAcmeIssuer, createCertManagerRelease, createPlainIssuer } from "@infra/cert-manager"
import { createConfig } from "@infra/core"
import { createNamespace, createSecret, mapSecretToRef } from "@infra/k8s"

const namespace = createNamespace({ name: "cert-manager" })
const config = createConfig({ name: "cert-manager" })

export const certManagerRelease = createCertManagerRelease({
  name: "cert-manager",
  namespace,
})

const apiTokenSecret = createSecret({
  name: "cloudflare-api-token",
  namespace,

  value: config.requireSecret("cloudflare-api-token"),
})

export const publicIssuer = createAcmeIssuer({
  name: "public",
  dependsOn: certManagerRelease,
  isClusterScoped: true,

  email: config.require("acme-email"),
  server: config.require("acme-server"),

  solver: {
    dns01: {
      cloudflare: {
        apiTokenSecretRef: mapSecretToRef(apiTokenSecret),
      },
    },
  },
})

export const plainIssuer = createPlainIssuer({
  name: "plain",
  isClusterScoped: true,
})

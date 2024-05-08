import { certManagerRelease } from "../cert-manager"
import { createHelmChart, createNamespace, createSecret, nodes, storageClasses } from "../common"

const { namespace, config } = createNamespace({ name: "mailu" })

const domain = config.require("domain")

const secretKeySecret = createSecret({
  name: "secret-key",
  namespace,

  key: "secret-key",
  value: config.requireSecret("secret-key"),
})

const adminPasswordSecret = createSecret({
  name: "admin-password",
  namespace,

  key: "password",
  value: config.requireSecret("admin-password"),
})

createHelmChart({
  name: "mailu",
  namespace,

  dependsOn: [certManagerRelease, secretKeySecret, adminPasswordSecret],

  chart: "mailu",
  repo: "https://mailu.github.io/helm-charts",

  values: {
    domain,
    hostnames: [`mail.${domain}`],

    ingress: {
      annotations: {
        "kubernetes.io/ingress.class": "traefik",
        "cert-manager.io/cluster-issuer": "public",
      },
    },

    persistence: {
      single_pvc: false,
    },

    redis: {
      enabled: false,
    },

    initialAccount: {
      enabled: true,
      username: "admin",
      domain,
      existingSecret: adminPasswordSecret.metadata.name,
      existingSecretPasswordKey: "password",
    },

    clamav: {
      enabled: false,
    },

    front: {
      nodeSelector: nodes.master.nodeSelector,
    },

    admin: {
      nodeSelector: nodes.master.nodeSelector,

      persistence: {
        size: "100Mi",
        storageClass: storageClasses.encrypted,
      },
    },

    postfix: {
      nodeSelector: nodes.publicAms.nodeSelector,

      persistence: {
        size: "100Mi",
        storageClass: storageClasses.encrypted,
      },
    },

    dovecot: {
      nodeSelector: nodes.master.nodeSelector,

      persistence: {
        size: "100Mi",
        storageClass: storageClasses.encrypted,
      },
    },

    rspamd: {
      nodeSelector: nodes.master.nodeSelector,

      persistence: {
        size: "200Mi",
        storageClass: storageClasses.encrypted,
      },
    },

    webmail: {
      nodeSelector: nodes.master.nodeSelector,

      persistence: {
        size: "100Mi",
        storageClass: storageClasses.encrypted,
      },
    },

    oletools: {
      nodeSelector: nodes.master.nodeSelector,
    },
  },
})

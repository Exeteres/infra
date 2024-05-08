import { localIssuer } from "../cert-manager"
import { createCertificate, createHelmRelease, nodes } from "../common"
import { namespace } from "./shared"

const { certificate: databaseCert, secretName: databaseCertSecretName } = createCertificate({
  name: "zitadel-database",
  namespace,

  domain: "zitadel-database-postgresql",
  issuer: localIssuer,
})

export const databaseRelease = createHelmRelease({
  name: "zitadel-database",
  namespace,

  dependsOn: databaseCert,

  repo: "https://charts.bitnami.com/bitnami",
  chart: "postgresql",

  values: {
    tls: {
      enabled: true,

      certificatesSecret: databaseCertSecretName,
      certCAFilename: "ca.crt",
      certFilename: "tls.crt",
      certKeyFilename: "tls.key",
    },

    volumePermissions: {
      enabled: true,
    },

    primary: {
      pgHbaConfiguration: [
        //
        "hostnossl all all 0.0.0.0/0    reject",
        "host      all all 127.0.0.1/32 md5",
        "hostssl   all all 0.0.0.0/0    cert clientcert=verify-full",
      ].join("\n"),

      persistence: {
        size: "1Gi",
      },

      nodeSelector: nodes.master.nodeSelector,
    },
  },
})

import { certManager, createCertificate, createCertificateSecretName } from "@infra/cert-manager"
import { pulumi } from "@infra/core"
import { createHelmRelease, k8s } from "@infra/k8s"

export function createDatabase(
  issuer: certManager.certmanager.v1.Issuer,
  namespace: k8s.core.v1.Namespace,
  nodeSelector?: pulumi.Input<Record<string, pulumi.Input<string>>>,
) {
  const databaseCertSecretName = createCertificateSecretName({
    name: "zitadel-database",
    namespace,
  })

  const databaseRelease = createHelmRelease({
    name: "zitadel-database",
    namespace,

    repo: "https://charts.bitnami.com/bitnami",
    chart: "postgresql",
    version: "15.4.0",

    skipAwait: true, // because we need to create the certificate first

    values: {
      nameOverride: "postgresql",

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
        nodeSelector,

        pgHbaConfiguration: [
          //
          "hostnossl all all 0.0.0.0/0    reject",
          "host      all all 127.0.0.1/32 md5",
          "hostssl   all all 0.0.0.0/0    cert clientcert=verify-full",
        ].join("\n"),

        persistence: {
          size: "400Mi",
        },
      },
    },
  })

  const { certificate: databaseCert } = createCertificate({
    name: "zitadel-database",
    namespace,
    secretName: databaseCertSecretName,

    domain: pulumi.interpolate`${databaseRelease.name}-postgresql`,
    issuer,
  })

  return {
    databaseRelease,
    databaseCert,
  }
}

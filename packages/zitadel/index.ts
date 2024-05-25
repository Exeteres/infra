import { pulumi } from "@infra/core"
import { createDatabase } from "./database"
import { certManager, createCaIssuer, createCertificate } from "@infra/cert-manager"
import { CommonAppOptions, createHelmRelease, createRandomSecret } from "@infra/k8s"
import { createTcpIngressRoute } from "@infra/traefik"

interface ZitadelAppOptions extends CommonAppOptions {
  /**
   * The fully qualified domain name of the Zitadel application.
   */
  domain: pulumi.Input<string>

  /**
   * The issuer to create the CA certificate to secure the communication between Zitadel components.
   */
  bootstrapIssuer: certManager.certmanager.v1.Issuer | certManager.certmanager.v1.ClusterIssuer

  /**
   * The issuer to create the public certificate for the Zitadel web interface.
   */
  publicIssuer: certManager.certmanager.v1.Issuer | certManager.certmanager.v1.ClusterIssuer
}

/**
 * Creates a ready-to-use Zitadel application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createZitadelApp(options: ZitadelAppOptions) {
  // Create the CA issuer
  // It will be used to create mTLS communication between Zitadel and the database
  const caIssuer = createCaIssuer({
    name: "zitadel",
    namespace: options.namespace,
    bootstrapIssuer: options.bootstrapIssuer,
  })

  // Create the database
  const { databaseRelease } = createDatabase(caIssuer, options.namespace, options.nodeSelector)

  // Create certificates for database users
  const { certificate: postgresUserCert, secretName: postgresUserCertSecretName } = createCertificate({
    name: "postgres-user",
    namespace: options.namespace,

    commonName: "postgres",
    issuer: caIssuer,
  })

  const { certificate: zitadelUserCert, secretName: zitadelUserCertSecretName } = createCertificate({
    name: "zitadel-user",
    namespace: options.namespace,

    commonName: "zitadel",
    issuer: caIssuer,
  })

  // Create public certificate for the web interface
  const { certificate: publicCert, secretName: publicCertSecretName } = createCertificate({
    name: "web",
    namespace: options.namespace,

    domain: options.domain,
    issuer: options.publicIssuer,
  })

  // Create secret for master key
  const masterKeySecret = createRandomSecret({
    name: "master-key",
    namespace: options.namespace,
    key: "masterkey",
    length: 16,
  })

  const zitadelRelease = createHelmRelease({
    name: options.name ?? "zitadel",
    namespace: options.namespace,

    dependsOn: [databaseRelease, masterKeySecret, postgresUserCert, zitadelUserCert, publicCert],

    repo: "https://charts.zitadel.com",
    chart: "zitadel",
    version: "7.14.0",

    values: {
      replicaCount: 1,
      nodeSelector: options.nodeSelector,

      zitadel: {
        masterkeySecretName: masterKeySecret.metadata.name,

        configmapConfig: {
          ExternalSecure: true,
          ExternalDomain: options.domain,
          ExternalPort: 443,
          TLS: {
            Enabled: true,
          },
          Database: {
            Postgres: {
              Host: pulumi.interpolate`${databaseRelease.name}-postgresql`,
              Port: 5432,
              Database: "zitadel",
              MaxOpenConns: 20,
              MaxIdleConns: 10,
              MaxConnLifetime: "30m",
              MaxConnIdleTime: "5m",
              User: {
                Username: "zitadel",
                SSL: {
                  Mode: "verify-full",
                },
              },
              Admin: {
                Username: "postgres",
                SSL: {
                  Mode: "verify-full",
                },
              },
            },
          },
        },

        dbSslCaCrtSecret: postgresUserCertSecretName,
        dbSslAdminCrtSecret: postgresUserCertSecretName,
        dbSslUserCrtSecret: zitadelUserCertSecretName,
        serverSslCrtSecret: publicCertSecretName,
      },
    },
  })

  const tcpIngressRoute = createTcpIngressRoute({
    name: "zitadel",
    namespace: options.namespace,

    domain: options.domain,

    serviceName: zitadelRelease.name,
    servicePort: 8080,

    tlsPassthrough: true,
  })

  return { caIssuer, databaseRelease, zitadelRelease, tcpIngressRoute }
}

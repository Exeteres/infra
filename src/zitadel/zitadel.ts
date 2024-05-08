import { localCaSecretName, localIssuer, publicIssuer } from "../cert-manager"
import { createCertificate, createHelmRelease, createSecret, createTcpIngressRoute, nodes } from "../common"
import { databaseRelease } from "./database"
import { config, domain, namespace } from "./shared"

const masterKeySecret = createSecret({
  name: "master-key",
  namespace,

  key: "masterkey",
  value: config.requireSecret("master-key"),
})

const { certificate: postgresUserCert, secretName: postgresUserCertSecretName } = createCertificate({
  name: "postgres-user",
  namespace,

  commonName: "postgres",
  issuer: localIssuer,
})

const { certificate: zitadelUserCert, secretName: zitadelUserCertSecretName } = createCertificate({
  name: "zitadel-user",
  namespace,

  commonName: "zitadel",
  issuer: localIssuer,
})

const { certificate: publicCert, secretName: publicCertSecretName } = createCertificate({
  name: "web",
  namespace,

  domain,
  issuer: publicIssuer,
})

void createHelmRelease({
  name: "zitadel",
  namespace,

  dependsOn: [databaseRelease, masterKeySecret, postgresUserCert, zitadelUserCert, publicCert],

  repo: "https://exeteres.github.io/zitadel-charts",
  chart: "zitadel",

  values: {
    replicaCount: 1,
    nodeSelector: nodes.master.nodeSelector,

    zitadel: {
      masterkeySecretName: masterKeySecret.metadata.name,

      configmapConfig: {
        ExternalSecure: true,
        ExternalDomain: domain,
        ExternalPort: 443,
        TLS: {
          Enabled: true,
        },
        Database: {
          Postgres: {
            Host: "zitadel-database-postgresql",
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

      dbSslCaCrtSecret: localCaSecretName,
      dbSslAdminCrtSecret: postgresUserCertSecretName,
      dbSslUserCrtSecret: zitadelUserCertSecretName,
      serverSslCrtSecret: publicCertSecretName,
    },
  },
})

void createTcpIngressRoute({
  name: "zitadel",
  namespace,

  domain,

  serviceName: "zitadel",
  servicePort: 8080,

  tlsPassthrough: true,
})

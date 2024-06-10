import { pulumi } from "@infra/core"
import { certManager } from "@infra/cert-manager"
import { postgresql } from "@infra/postgresql"
import { k8s } from "@infra/k8s"
import { traefik } from "@infra/traefik"

export interface ApplicationOptions extends k8s.ApplicationOptions {
  /**
   * The fully qualified domain name of the Zitadel application.
   */
  domain: pulumi.Input<string>

  /**
   * The issuer to create the CA certificate to secure the communication between Zitadel components.
   */
  bootstrapIssuer: pulumi.Input<certManager.Issuer>

  /**
   * The issuer to create the public certificate for the Zitadel web interface.
   */
  publicIssuer: pulumi.Input<certManager.Issuer>

  /**
   * The extra options for the database application.
   */
  databaseOptions?: postgresql.PostgreSQLOptions
}

export interface Application extends k8s.ReleaseApplication {
  /**
   * The database application which was deployed for Zitadel.
   */
  database: postgresql.PostgreSQLApplication

  /**
   * The ingress route to access the Zitadel application.
   */
  ingressRoute: traefik.raw.traefik.v1alpha1.IngressRouteTCP
}

/**
 * Creates a ready-to-use Zitadel application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "zitadel"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  // Create the database
  const database = postgresql.createApplication({
    namespace,
    prefix: fullName,

    bootstrapIssuer: options.bootstrapIssuer,
    nodeSelector: options.nodeSelector,

    ...options.databaseOptions,
  })

  // Create certificates for database users
  const postgresUserCertBundle = postgresql.createClientCertificate({
    application: database,
    roleName: "postgres",
  })

  const zitadelUserCertBundle = postgresql.createClientCertificate({
    application: database,
    roleName: "zitadel",
  })

  // Create public certificate for the web interface
  const webCertBundle = certManager.createCertificate({
    name: `${fullName}-web`,
    namespace,

    domain: options.domain,
    issuer: options.publicIssuer,
  })

  // Create secret for master key
  const masterKeySecret = k8s.createRandomSecret({
    name: `${fullName}-masterkey`,
    namespace,
    key: "masterkey",
    length: 16,
  })

  const release = k8s.createHelmRelease({
    name,
    namespace,

    repo: "https://charts.zitadel.com",
    chart: "zitadel",
    version: "7.14.0",

    dependsOn: [
      database.release,
      postgresUserCertBundle.certificate,
      zitadelUserCertBundle.certificate,
      webCertBundle.certificate,
      masterKeySecret,
    ],

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
              Host: database.name,
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

        dbSslCaCrtSecret: postgresUserCertBundle.secretName,
        dbSslAdminCrtSecret: postgresUserCertBundle.secretName,
        dbSslUserCrtSecret: zitadelUserCertBundle.secretName,
        serverSslCrtSecret: webCertBundle.secretName,
      },
    },
  })

  const ingressRoute = traefik.createTcpIngressRoute({
    name: fullName,
    namespace,

    route: {
      domain: options.domain,

      service: {
        name: release.name,
        port: 8080,
      },
    },

    tlsPassthrough: true,
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    database,
    release,
    ingressRoute,
  }
}

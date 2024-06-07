import { certManager } from "@infra/cert-manager"
import { merge, pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export type PostgreSQLOptions = k8s.ReleaseApplicationOptions &
  (
    | {
        /**
         * The issuer to use for the database certificate.
         */
        issuer: pulumi.Input<certManager.Issuer>
      }
    | {
        /**
         * The issuer to create a ca issuer for the database certificate.
         * Should be provided if issuer is not provided.
         */
        bootstrapIssuer: pulumi.Input<certManager.Issuer>
      }
  )

export interface PostgreSQLApplication extends k8s.ReleaseApplication {
  /**
   * The issuer for the PostgreSQL database.
   */
  issuer: pulumi.Output<certManager.Issuer>

  /**
   * The certificate for the PostgreSQL database.
   */
  certificate: certManager.CertificateBundle
}

/**
 * Creates a PostgreSQL database using the Bitnami Helm chart.
 *
 * @param options The options for the PostgreSQL database.
 * @returns The PostgreSQL database release and certificate.
 */
export function createApplication(options: PostgreSQLOptions): PostgreSQLApplication {
  const name = options.name ?? "postgresql"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const issuer =
    "issuer" in options
      ? options.issuer
      : certManager.createCaIssuer({ name: fullName, namespace, bootstrapIssuer: options.bootstrapIssuer })

  const certificate = certManager.createCertificate({
    name: fullName,
    namespace,

    secretName: certManager.createCertificateSecretName(name),

    domain: "postgresql",
    issuer,
  })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    repo: "https://charts.bitnami.com/bitnami",
    chart: "postgresql",
    version: "15.4.0",

    ...options.releaseOptions,

    values: merge(
      {
        fullnameOverride: name,

        tls: {
          enabled: true,

          certificatesSecret: certificate.secretName,
          certCAFilename: "ca.crt",
          certFilename: "tls.crt",
          certKeyFilename: "tls.key",
        },

        volumePermissions: {
          enabled: true,
        },

        primary: {
          nodeSelector: options.nodeSelector,

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
      options.releaseOptions?.values ?? {},
    ),
  })

  return {
    name,
    fullName,
    prefix: options.prefix,
    namespace,

    issuer: pulumi.output(issuer),
    release,
    certificate,
  }
}

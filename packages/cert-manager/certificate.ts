import { k8s } from "@infra/k8s"
import { kq, raw } from "./imports"
import { normalizeInputArray, pulumi } from "@infra/core"
import { inspect } from "util"

export type Issuer = raw.certmanager.v1.ClusterIssuer | raw.certmanager.v1.Issuer

interface CertificateOptions extends k8s.CommonOptions {
  /**
   * The Common Name (CN) of the certificate.
   * Typically, it is used for mTLS authentication.
   */
  commonName?: pulumi.Input<string>

  /**
   * The domain of the certificate.
   * Typically, it is used for public-facing services.
   */
  domain?: pulumi.Input<string>

  /**
   * The domains of the certificate.
   * Typically, it is used for public-facing services.
   */
  domains?: pulumi.Input<string[]>

  /**
   * The issuer which will be used to create the certificate.
   * May be a ClusterIssuer or an Issuer.
   */
  issuer: pulumi.Input<Issuer>

  /**
   * The name of the certificate to create.
   * If not provided, it will be generated from the `name` field.
   */
  secretName?: string
}

export interface CertificateBundle {
  /**
   * The certificate resource created.
   */
  certificate: raw.certmanager.v1.Certificate

  /**
   * The secret name where the certificate is stored.
   * Can be specified in the `tls` field of an Ingress.
   */
  secretName: string
}

/**
 * Create a secret name for the given certificate name.
 *
 * @param name The name of the certificate.
 * @returns The secret name.
 */
export function createCertificateSecretName(name: string): string {
  return `${name}-cert`
}

/**
 * Create a certificate with the given options.
 *
 * @param options The options for creating a certificate.
 * @returns The certificate and the secret name.
 */
export function createCertificate(options: CertificateOptions): CertificateBundle {
  const secretName = options.secretName ?? createCertificateSecretName(options.name)

  const certificate = new raw.certmanager.v1.Certificate(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: {
        commonName: options.commonName,
        dnsNames: normalizeInputArray(options.domain, options.domains),
        issuerRef: pulumi.output(options.issuer).apply(issuer => ({
          name: issuer.metadata.apply(m => m!.name) as pulumi.Input<string>,
          kind: issuer.kind as pulumi.Input<string>,
        })),
        secretName,
      },
    },
    k8s.mapPulumiOptions(options),
  )

  return { certificate, secretName }
}

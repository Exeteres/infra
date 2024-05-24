import { Output } from "@pulumi/pulumi"
import { CommonOptions, crds, mapMetadata, mapPulumiOptions, normalizeInputArray, pulumi } from "../shared"

interface CertificateOptions extends CommonOptions {
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
  issuer: crds.certmanager.v1.ClusterIssuer | crds.certmanager.v1.Issuer

  /**
   * The custom name of the certificate secret.
   * Useful when certificate secret name required before creating the certificate.
   * It can be created using `createCertificateSecretName` function.
   */
  secretName?: pulumi.Input<string>
}

interface CertificatePair {
  /**
   * The certificate resource created.
   */
  certificate: crds.certmanager.v1.Certificate

  /**
   * The name of the secret that contains the certificate.
   * Can be specified in the `tls` field of an Ingress.
   */
  secretName: pulumi.Output<string>
}

export function createCertificateSecretName(options: CommonOptions): pulumi.Output<string> {
  return pulumi.output(`${options.name}-cert`)
}

/**
 * Create a certificate with the given options.
 *
 * @param options The options for creating a certificate.
 * @returns The certificate and the secret name.
 */
export function createCertificate(options: CertificateOptions): CertificatePair {
  const secretName = options.secretName ?? createCertificateSecretName(options)

  const certificate = new crds.certmanager.v1.Certificate(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        commonName: options.commonName,
        dnsNames: normalizeInputArray(options.domain, options.domains),
        issuerRef: {
          name: options.issuer.metadata.apply(m => m!.name) as pulumi.Input<string>,
          kind: options.issuer.kind as pulumi.Input<string>,
        },
        secretName,
      },
    },
    mapPulumiOptions(options),
  )

  return { certificate, secretName: pulumi.output(secretName) }
}

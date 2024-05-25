import { ClusteredOptions, NamespaceScoped, mapMetadata, mapPulumiOptions } from "@infra/k8s"
import { certManager } from "./imports"
import { pulumi } from "@infra/core"

interface CaIssuerOptions extends ClusteredOptions {
  /**
   * The issuer which will be used to create the certificate for the CA itself.
   */
  bootstrapIssuer: certManager.certmanager.v1.Issuer | certManager.certmanager.v1.ClusterIssuer
}

/**
 * Creates an issuer which signs certificates using a self-signed CA.
 *
 * @param options The options for the issuer.
 * @returns The Issuer resource.
 */
export function createCaIssuer(options: NamespaceScoped<CaIssuerOptions>): certManager.certmanager.v1.Issuer

/**
 * Creates a cluster issuer which signs certificates using a self-signed CA.
 *
 * @param options The options for the issuer.
 * @returns The ClusterIssuer resource.
 */
export function createCaIssuer(options: NamespaceScoped<CaIssuerOptions>): certManager.certmanager.v1.ClusterIssuer

export function createCaIssuer(options: CaIssuerOptions) {
  const Resource = options.isClusterScoped
    ? certManager.certmanager.v1.ClusterIssuer
    : certManager.certmanager.v1.Issuer

  const secretName = `${options.name}-issuer`

  const caCertificate = new certManager.certmanager.v1.Certificate(
    `${options.name}-ca`,
    {
      metadata: mapMetadata(options),
      spec: {
        secretName,
        isCA: true,
        commonName: options.name,
        privateKey: {
          algorithm: "ECDSA",
          size: 256,
        },
        issuerRef: {
          name: options.bootstrapIssuer.metadata.apply(m => m!.name) as pulumi.Input<string>,
          kind: options.bootstrapIssuer.kind as pulumi.Input<string>,
          group: "cert-manager.io",
        },
      },
    },
    mapPulumiOptions(options),
  )

  return new Resource(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        ca: {
          secretName,
        },
      },
    },
    mapPulumiOptions(options, { dependsOn: caCertificate }),
  )
}

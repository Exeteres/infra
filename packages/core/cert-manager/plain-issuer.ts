import { ClusterScoped, ClusteredOptions, NamespaceScoped, crds, mapMetadata, mapPulumiOptions } from "../shared"

/**
 * Creates a plain issuer which just creates certificates not signed by any CA.
 * Useful for bootstrapping CA issuers.
 *
 * @param options The options for the issuer.
 * @returns The Issuer resource.
 */
export function createPlainIssuer(options: NamespaceScoped<ClusteredOptions>): crds.certmanager.v1.Issuer

/**
 * Creates a plain issuer which just creates certificates not signed by any CA.
 * Useful for bootstrapping CA issuers.
 *
 * @param options The options for the issuer.
 * @returns The ClusterIssuer resource.
 */
export function createPlainIssuer(options: ClusterScoped<ClusteredOptions>): crds.certmanager.v1.ClusterIssuer

export function createPlainIssuer(options: NamespaceScoped<ClusteredOptions> | ClusterScoped<ClusteredOptions>) {
  const Resource = options.isClusterScoped ? crds.certmanager.v1.ClusterIssuer : crds.certmanager.v1.Issuer

  return new Resource(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        selfSigned: {},
      },
    },
    mapPulumiOptions(options),
  )
}

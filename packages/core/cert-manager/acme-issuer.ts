import {
  ClusterScoped,
  ClusteredOptions,
  NamespaceScoped,
  crds,
  mapMetadata,
  mapPulumiOptions,
  normalizeInputArray,
  pulumi,
} from "../shared"

interface AcmeIssuerOptions extends ClusteredOptions {
  /**
   * The email address to use for the ACME account.
   */
  email: pulumi.Input<string>

  /**
   * The ACME server URL.
   * @example https://acme-staging-v02.api.letsencrypt.org/directory
   * @example https://acme-v02.api.letsencrypt.org/directory
   */
  server: pulumi.Input<string>

  /**
   * The solver configuration for the ACME issuer.
   */
  solver?: pulumi.Input<crds.types.input.certmanager.v1.ClusterIssuerSpecAcmeSolversArgs>

  /**
   * The solver configurations for the ACME issuer.
   */
  solvers?: pulumi.Input<crds.types.input.certmanager.v1.ClusterIssuerSpecAcmeSolversArgs[]>
}

/**
 * Create an issuer which issues certificates using the ACME protocol.
 *
 * @param options The options for the issuer.
 * @returns The Issuer resource.
 */
export function createAcmeIssuer(options: NamespaceScoped<AcmeIssuerOptions>): crds.certmanager.v1.Issuer

/**
 * Create a cluster issuer which issues certificates using the ACME protocol.
 *
 * @param options The options for the issuer.
 * @returns The ClusterIssuer resource.
 */
export function createAcmeIssuer(options: ClusterScoped<AcmeIssuerOptions>): crds.certmanager.v1.ClusterIssuer

export function createAcmeIssuer(options: NamespaceScoped<AcmeIssuerOptions> | ClusterScoped<AcmeIssuerOptions>) {
  const Resource = options.isClusterScoped ? crds.certmanager.v1.ClusterIssuer : crds.certmanager.v1.Issuer

  const secretName = `${options.name}-issuer`

  return new Resource(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        acme: {
          server: options.server,
          email: options.email,

          solvers: normalizeInputArray(options.solver, options.solvers),

          privateKeySecretRef: {
            name: secretName,
          },
        },
      },
    },
    mapPulumiOptions(options),
  )
}

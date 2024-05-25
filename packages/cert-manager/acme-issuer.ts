import { normalizeInputArray, pulumi } from "@infra/core"
import { ClusterScoped, ClusteredOptions, NamespaceScoped, mapMetadata, mapPulumiOptions } from "@infra/k8s"
import { certManager } from "./imports"

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
  solver?: pulumi.Input<certManager.types.input.certmanager.v1.ClusterIssuerSpecAcmeSolversArgs>

  /**
   * The solver configurations for the ACME issuer.
   */
  solvers?: pulumi.Input<certManager.types.input.certmanager.v1.ClusterIssuerSpecAcmeSolversArgs[]>
}

/**
 * Create an issuer which issues certificates using the ACME protocol.
 *
 * @param options The options for the issuer.
 * @returns The Issuer resource.
 */
export function createAcmeIssuer(options: NamespaceScoped<AcmeIssuerOptions>): certManager.certmanager.v1.Issuer

/**
 * Create a cluster issuer which issues certificates using the ACME protocol.
 *
 * @param options The options for the issuer.
 * @returns The ClusterIssuer resource.
 */
export function createAcmeIssuer(options: ClusterScoped<AcmeIssuerOptions>): certManager.certmanager.v1.ClusterIssuer

export function createAcmeIssuer(options: NamespaceScoped<AcmeIssuerOptions> | ClusterScoped<AcmeIssuerOptions>) {
  const Resource = options.isClusterScoped
    ? certManager.certmanager.v1.ClusterIssuer
    : certManager.certmanager.v1.Issuer

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

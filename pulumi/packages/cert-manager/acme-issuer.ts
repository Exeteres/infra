import { Input, normalizeInputs } from "@infra/core"
import { raw } from "./imports"
import { k8s } from "@infra/k8s"

export type AcmeIssuerOptions = k8s.ScopedOptions & {
  /**
   * The email address to use for the ACME account.
   */
  email: Input<string>

  /**
   * The ACME server URL.
   * @example https://acme-staging-v02.api.letsencrypt.org/directory
   * @example https://acme-v02.api.letsencrypt.org/directory
   */
  server: Input<string>

  /**
   * The solver configuration for the ACME issuer.
   */
  solver?: Input<raw.types.input.certmanager.v1.ClusterIssuerSpecAcmeSolversArgs>

  /**
   * The solver configurations for the ACME issuer.
   */
  solvers?: Input<raw.types.input.certmanager.v1.ClusterIssuerSpecAcmeSolversArgs[]>
}

export function createAcmeIssuer(options: AcmeIssuerOptions) {
  const Resource = options.isClusterScoped ? raw.certmanager.v1.ClusterIssuer : raw.certmanager.v1.Issuer

  const secretName = `${options.name}-issuer`

  return new Resource(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: {
        acme: {
          server: options.server,
          email: options.email,

          solvers: normalizeInputs(options.solver, options.solvers),

          privateKeySecretRef: {
            name: secretName,
          },
        },
      },
    },
    k8s.mapPulumiOptions(options),
  )
}

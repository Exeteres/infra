import { normalizeInputArray, pulumi } from "@infra/core"
import { raw } from "./imports"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"

export interface IngressOptions extends CommonOptions {
  /**
   * The ingress rule to apply.
   */
  rule?: pulumi.Input<raw.types.input.networking.v1.IngressRule>

  /**
   * The ingress rules to apply.
   */
  rules?: pulumi.Input<pulumi.Input<raw.types.input.networking.v1.IngressRule>[]>

  /**
   * The ingress class name.
   */
  className?: pulumi.Input<string>

  /**
   * The fully qualified domain name where the ingress will be exposed.
   */
  domain?: pulumi.Input<string>

  /**
   * The name of the secret containing the certificate to use for TLS.
   */
  tlsSecretName?: pulumi.Input<string>

  /**
   * The TLS configuration.
   */
  tls?: pulumi.Input<raw.types.input.networking.v1.IngressTLS>
}

/**
 * Creates an Ingress.
 *
 * @param options The ingress options.
 * @returns The Ingress.
 */
export function createIngress(options: IngressOptions) {
  return new raw.networking.v1.Ingress(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        rules: normalizeInputArray(options.rule, options.rules),
        ingressClassName: options.className,
        tls:
          options.tls || options.tlsSecretName
            ? [
                {
                  ...options.tls,
                  secretName: options.tlsSecretName,
                },
              ]
            : undefined,
      },
    },
    mapPulumiOptions(options),
  )
}

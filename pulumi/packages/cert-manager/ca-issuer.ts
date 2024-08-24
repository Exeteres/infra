import { k8s } from "@infra/k8s"
import { Issuer } from "./certificate"
import { raw } from "./imports"
import { Input, output } from "@infra/core"

export type CaIssuerOptions = k8s.ScopedOptions & {
  /**
   * The issuer which will be used to create the certificate for the CA itself.
   */
  bootstrapIssuer: Input<Issuer>
}

export function createCaIssuer(options: CaIssuerOptions) {
  const Resource = options.isClusterScoped ? raw.certmanager.v1.ClusterIssuer : raw.certmanager.v1.Issuer

  const secretName = `${options.name}-issuer`

  const caCertificate = new raw.certmanager.v1.Certificate(
    `${options.name}-ca`,
    {
      metadata: k8s.mapMetadata(options, { name: `${options.name}-ca` }),
      spec: {
        secretName,
        isCA: true,
        commonName: options.name,
        privateKey: {
          algorithm: "ECDSA",
          size: 256,
        },
        issuerRef: output(options.bootstrapIssuer).apply(issuer => ({
          name: issuer.metadata.apply(m => m!.name) as Input<string>,
          kind: issuer.kind as Input<string>,
          group: "cert-manager.io",
        })),
      },
    },
    k8s.mapPulumiOptions(options),
  )

  return new Resource(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: {
        ca: {
          secretName,
        },
      },
    },
    k8s.mapPulumiOptions(options, { dependsOn: caCertificate }),
  )
}

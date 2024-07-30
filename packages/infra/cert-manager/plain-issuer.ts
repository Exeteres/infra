import { k8s } from "@infra/k8s"
import { raw } from "./imports"

export function createPlainIssuer(options: k8s.ScopedOptions) {
  const Resource = options.isClusterScoped ? raw.certmanager.v1.ClusterIssuer : raw.certmanager.v1.Issuer

  return new Resource(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: {
        selfSigned: {},
      },
    },
    k8s.mapPulumiOptions(options),
  )
}

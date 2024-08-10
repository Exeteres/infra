import { certManager } from "@infra/cert-manager"
import { resolveStack } from "./stack"
import { k8s } from "@infra/k8s"
import { singleton } from "./utils"

export const getPublicIssuer = singleton(() => {
  const certManagerStack = resolveStack("cert-manager")

  return k8s.import(certManagerStack, certManager.raw.certmanager.v1.ClusterIssuer, "publicIssuer")
})

export function createWebCertificate(namespace: k8s.raw.core.v1.Namespace, domain: string) {
  return certManager.createCertificate({
    name: domain.replace("*", "wildcard"),
    namespace,

    issuer: getPublicIssuer(),
    domain,
  })
}

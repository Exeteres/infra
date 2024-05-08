import * as k8s from "@pulumi/kubernetes"

interface CertificateOptions {
  name: string
  namespace: k8s.core.v1.Namespace

  commonName?: string
  domain?: string

  issuer: k8s.apiextensions.CustomResource
}

export const createCertificate = ({ name, namespace, commonName, domain, issuer }: CertificateOptions) => {
  const secretName = `${name}-cert`

  const certificate = new k8s.apiextensions.CustomResource(
    name,
    {
      apiVersion: "cert-manager.io/v1",
      kind: "Certificate",
      metadata: {
        name,
        namespace: namespace.metadata.name,
      },
      spec: {
        commonName,
        dnsNames: domain ? [domain] : [],
        issuerRef: {
          name: issuer.metadata.name,
          kind: "ClusterIssuer",
        },
        secretName,
      },
    },
    { parent: namespace, dependsOn: issuer },
  )

  return { certificate, secretName }
}

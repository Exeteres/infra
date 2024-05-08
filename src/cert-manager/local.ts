import { k8s } from "../common"
import { certManagerRelease, trustManagerRelease } from "./helm"
import { localCommonName, namespace } from "./shared"

// Create SelfSigned Issuer with the single purpose: sign certificates for the local CA
const bootstrapIssuer = new k8s.apiextensions.CustomResource(
  "local-ca-bootstrap",
  {
    apiVersion: "cert-manager.io/v1",
    kind: "Issuer",

    metadata: {
      name: "local-ca-bootstrap",
      namespace: namespace.metadata.name,
    },

    spec: {
      selfSigned: {},
    },
  },
  { parent: namespace, dependsOn: certManagerRelease },
)

// Create a Certificate resource for the local CA
const localCaCert = new k8s.apiextensions.CustomResource(
  "local-ca",
  {
    apiVersion: "cert-manager.io/v1",
    kind: "Certificate",

    metadata: {
      name: "local-ca",
      namespace: namespace.metadata.name,
    },

    spec: {
      isCA: true,
      commonName: localCommonName,

      secretName: "local-ca",

      privateKey: {
        algorithm: "ECDSA",
        size: 256,
      },

      issuerRef: {
        name: bootstrapIssuer.metadata.name,
        kind: bootstrapIssuer.kind,
        group: "cert-manager.io",
      },
    },
  },
  { parent: namespace, dependsOn: certManagerRelease },
)

// Create ClusterIssuer to sign certificates for the local environment
export const localIssuer = new k8s.apiextensions.CustomResource(
  "local",
  {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",

    metadata: {
      name: "local",
    },

    spec: {
      ca: {
        secretName: "local-ca",
      },
    },
  },
  { parent: namespace, dependsOn: localCaCert },
)

export const injectLocalCaCertLabels = {
  "exeteres.dev/inject-local-ca-cert": "true",
}

// Create Trust Manager Bundle to inject the local CA certificate into namespaces
void new k8s.apiextensions.CustomResource(
  "local-ca-cert",
  {
    apiVersion: "trust.cert-manager.io/v1alpha1",
    kind: "Bundle",

    metadata: {
      name: "local-ca-cert",
      namespace: namespace.metadata.name,
    },

    spec: {
      sources: [
        {
          secret: {
            name: "local-ca",
            key: "tls.crt",
          },
        },
      ],

      target: {
        secret: {
          key: "ca.crt",
        },

        configMap: {
          key: "ca.crt",
        },

        namespaceSelector: {
          matchLabels: injectLocalCaCertLabels,
        },
      },
    },
  },
  { parent: namespace, dependsOn: [localIssuer, trustManagerRelease] },
)

export const localCaSecretName = "local-ca-cert"
export const lcoalCaConfigMapName = "local-ca-cert"

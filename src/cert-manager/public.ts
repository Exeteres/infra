import { k8s, nodes } from "../common"
import { certManagerRelease } from "./helm"
import { acmeEmail, namespace } from "./shared"

// Create ClusterIssuer to sign certificates for the public domains
export const publicIssuer = new k8s.apiextensions.CustomResource(
  "public",
  {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",

    metadata: {
      name: "public",
    },

    spec: {
      acme: {
        server: "https://acme-v02.api.letsencrypt.org/directory",
        email: acmeEmail,

        privateKeySecretRef: {
          name: "letsencrypt",
        },

        solvers: [
          {
            http01: {
              ingress: {
                class: "traefik",
                podTemplate: {
                  spec: {
                    nodeSelector: nodes.master.nodeSelector,
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  { parent: namespace, dependsOn: certManagerRelease },
)

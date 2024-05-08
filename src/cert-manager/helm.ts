import { createHelmRelease, nodes } from "../common"
import { namespace } from "./shared"

export const certManagerRelease = createHelmRelease({
  name: "cert-manager",
  namespace,

  chart: "cert-manager",
  repo: "https://charts.jetstack.io",

  values: {
    installCRDs: true,

    nodeSelector: nodes.master.nodeSelector,

    webhook: {
      nodeSelector: nodes.master.nodeSelector,
    },

    cainjector: {
      nodeSelector: nodes.master.nodeSelector,
    },

    startupapicheck: {
      nodeSelector: nodes.master.nodeSelector,
    },
  },
})

export const trustManagerRelease = createHelmRelease({
  name: "trust-manager",
  namespace,

  dependsOn: certManagerRelease,

  chart: "trust-manager",
  repo: "https://charts.jetstack.io",

  values: {
    nodeSelector: nodes.master.nodeSelector,

    secretTargets: {
      enabled: true,
      authorizedSecrets: ["local-ca-cert"],
    },
  },
})

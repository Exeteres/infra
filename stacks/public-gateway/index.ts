import { k8s } from "@infra/k8s"
import { traefik } from "@infra/traefik"

const namespace = k8s.createNamespace({ name: "public-gateway" })

traefik.createApplication({
  namespace,

  release: {
    values: {
      providers: {
        kubernetesCRD: {
          enabled: false,
        },

        kubernetesIngress: {
          enabled: true,
        },

        kubernetesGateway: {
          enabled: true,
          experimentalChannel: true,
        },
      },

      gateway: {
        enabled: false,
      },

      ingressClass: {
        enabled: true,
        name: "public",
      },

      gatewayClass: {
        name: "public",
      },

      experimental: {
        kubernetesGateway: {
          enabled: true,
        },
      },
    },
  },
})

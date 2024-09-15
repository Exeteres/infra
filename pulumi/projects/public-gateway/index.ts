import { cilium } from "@infra/cilium"
import { k8s } from "@infra/k8s"
import { traefik } from "@infra/traefik"

const namespace = k8s.createNamespace({ name: "public-gateway" })

const { release } = traefik.createApplication({
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

cilium.createAllowApiServerPolicy({ namespace })

const service = release.status.status.apply(() => k8s.raw.core.v1.Service.get("traefik", "public-gateway/traefik"))

export const serviceId = k8s.export(service)

cilium.createPolicy({
  name: "allow-from-world",
  namespace,

  description: "Allow incoming traffic from the world",

  ingress: {
    fromEntity: "world",
  },
})

cilium.createAllowToNamespacesPolicy({ namespace })

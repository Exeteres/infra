import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { tailscale } from "@infra/tailscale"
import { traefik } from "@infra/traefik"
import { getSharedEnvironment } from "@projects/common"

const namespace = k8s.createNamespace({ name: "internal-gateway" })

const config = new pulumi.Config()
const tailscaleAuthKey = config.requireSecret("tailscaleAuthKey")
const tailscaleAuthState = config.getSecret("tailscaleAuthState")

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
        isDefaultClass: false,
        name: "internal",
      },

      gatewayClass: {
        name: "internal",
      },

      experimental: {
        kubernetesGateway: {
          enabled: true,
        },
      },

      service: {
        type: "ClusterIP",
      },
    },
  },
})

const service = release.status.status.apply(() => k8s.raw.core.v1.Service.get("traefik", "internal-gateway/traefik"))

export const gatewayIp = service.spec.clusterIP

const { serviceCidr } = getSharedEnvironment()

const { container, serviceAccount } = tailscale.createContainer({
  namespace,
  secretName: "tailscale-router",
  hostname: `gateway-${pulumi.getStack()}`,
  authKey: tailscaleAuthKey,
  authState: tailscaleAuthState,
  advertiseRoutes: [serviceCidr],
})

k8s.createWorkload({
  name: "tailscale-router",
  namespace,

  kind: "Deployment",

  container,
  serviceAccountName: serviceAccount.metadata.name,
})

export const serviceId = k8s.export(service)

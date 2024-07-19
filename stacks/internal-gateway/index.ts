import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { tailscale } from "@infra/tailscale"
import { traefik } from "@infra/traefik"

const namespace = k8s.createNamespace({ name: "internal-gateway" })

const config = new pulumi.Config("internal-gateway")
const tailscaleAuthKey = config.requireSecret("tailscaleAuthKey")

const { release } = traefik.createApplication({
  namespace,

  releaseOptions: {
    values: {
      providers: {
        kubernetesCRD: {
          enabled: false,
        },

        kubernetesIngress: {
          enabled: false,
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

tailscale.createAuthSecret({
  name: "vpn-tailscale-auth",
  namespace,
  value: tailscaleAuthKey,
})

k8s.createWorkload({
  name: "tailscale-router",
  namespace,

  kind: "Deployment",

  container: tailscale.createContainerSpec("internal-gateway", {
    env: [
      {
        name: "TS_EXTRA_ARGS",
        value: pulumi.interpolate`--advertise-routes=${gatewayIp}/32`,
      },
    ],
  }),
})

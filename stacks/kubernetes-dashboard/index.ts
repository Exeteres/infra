import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { kubernetesDashboard } from "@infra/kubernetes-dashboard"

const config = new pulumi.Config("kubernetes-dashboard")

const hostname = config.require("hostname")
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")

const application = kubernetesDashboard.createApplication({
  releaseOptions: {
    values: {
      app: {
        ingress: {
          enabled: true,
          hosts: [hostname],
          ingressClassName: "tailscale",
        },
      },
    },
  },

  nodeSelector,
})

kubernetesDashboard.createServiceAccount({
  name: "dashboard-account",
  namespace: application.namespace,
  dependsOn: application.release,
})

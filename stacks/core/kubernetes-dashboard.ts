import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { kubernetesDashboard } from "@infra/kubernetes-dashboard"

const config = new pulumi.Config("kubernetes-dashboard")

const hostname = config.require("hostname")

const application = kubernetesDashboard.createApplication({
  nodeSelector: k8s.mapHostnameToNodeSelector(config.require("node")),

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
})

kubernetesDashboard.createServiceAccount({
  name: "dashboard-account",
  namespace: application.namespace,
  dependsOn: application.release,
})

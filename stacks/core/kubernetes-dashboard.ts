import { kubernetesDashboard } from "@infra/kubernetes-dashboard"

const dashboard = kubernetesDashboard.createApplication()

kubernetesDashboard.createServiceAccount({
  name: "dashboard-account",
  namespace: dashboard.namespace,
  dependsOn: dashboard.release,
})

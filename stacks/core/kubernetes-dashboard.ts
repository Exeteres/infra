import { createKubernetesDashboardRelease, createKubernetesDashboardServiceAccount } from "@infra/kubernetes-dashboard"
import { createNamespace } from "@infra/k8s"

const namespace = createNamespace({ name: "kubernetes-dashboard" })

export const kubernetesDashboardRelease = createKubernetesDashboardRelease({
  name: "kubernetes-dashboard",
  namespace,
})

export const dashboardAccount = createKubernetesDashboardServiceAccount({
  name: "dashboard-account",
  namespace,

  dependsOn: kubernetesDashboardRelease,
})

import { createKubernetesDashboardRelease, createKubernetesDashboardServiceAccount, createNamespace } from "@infra/core"

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

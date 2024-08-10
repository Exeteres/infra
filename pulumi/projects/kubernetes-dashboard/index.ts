import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { kubernetesDashboard } from "@infra/kubernetes-dashboard"
import { exposeInternalService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "kubernetes-dashboard" })

const config = new pulumi.Config("kubernetes-dashboard")
const domain = config.require("domain")

const { gateway } = exposeInternalService(namespace, domain)

const application = kubernetesDashboard.createApplication({
  namespace,
  gateway,
})

kubernetesDashboard.createServiceAccount({
  name: "dashboard-account",
  namespace: application.namespace,
  dependsOn: application.release,
})

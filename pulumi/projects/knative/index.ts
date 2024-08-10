import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { knative } from "@infra/knative"
import { exposeInternalService } from "@projects/common"

const kourierNamespace = k8s.createNamespace({ name: "kourier-system" })

const config = new pulumi.Config("knative")
const domain = config.require("domain")

const { gateway } = exposeInternalService(kourierNamespace, `*.functions.${domain}`)

knative.createApplication({
  domain,
  kourierNamespace,
  gateway,
})

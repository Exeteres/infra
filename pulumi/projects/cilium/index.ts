import { cilium } from "@infra/cilium"
import { pulumi } from "@infra/core"
import { getSharedEnvironment } from "@projects/common"

const { internalIp } = getSharedEnvironment()

cilium.createApplication({
  k8sServiceHost: internalIp,
  k8sContext: pulumi.getStack(),
})

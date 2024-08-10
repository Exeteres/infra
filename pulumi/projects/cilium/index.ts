import { cilium } from "@infra/cilium"
import { pulumi } from "@infra/core"
import { getSharedEnvironment } from "@projects/common"

const { publicIp } = getSharedEnvironment()

cilium.createApplication({
  k8sServiceHost: publicIp,
  k8sContext: pulumi.getStack(),
})

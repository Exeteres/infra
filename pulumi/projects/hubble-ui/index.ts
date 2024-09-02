import { pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { exposeInternalHttpService } from "@projects/common"

const namespace = k8s.raw.core.v1.Namespace.get("kube-system", "kube-system")

const config = new pulumi.Config()
const domain = config.require("domain")

const { gateway } = exposeInternalHttpService({ namespace, domain })

gw.createApplicationRoutes(namespace, gateway, {
  httpRoute: {
    name: "hubble-ui",
    rule: {
      backend: {
        name: "hubble-ui",
        port: 80,
      },
    },
  },
})

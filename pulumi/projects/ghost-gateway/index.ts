import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { exposePublicHttpService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "ghost-gateway" })

const config = new pulumi.Config()
const domain = config.require("domain")

const { gateway } = exposePublicHttpService({
  namespace,
  domain,
  listener: {
    allowedRoutes: {
      namespaces: {
        from: "Selector",
        selector: {
          matchLabels: {
            "app.kubernetes.io/name": "ghost",
          },
        },
      },
    },
  },
})

export const gatewayId = k8s.export(gateway.gateway)
export { domain }

import { injectLocalCaCertLabels } from "../cert-manager/local"
import { createNamespace } from "../common"

export const { namespace, config } = createNamespace({
  name: "zitadel",
  labels: {
    ...injectLocalCaCertLabels,
  },
})

export const domain = config.require("domain")

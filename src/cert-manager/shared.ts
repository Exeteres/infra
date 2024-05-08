import { createNamespace } from "../common"

export const { namespace, config } = createNamespace({ name: "cert-manager" })

export const localCommonName = config.require("local-common-name")
export const acmeEmail = config.require("acme-email")

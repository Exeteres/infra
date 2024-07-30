import { createNamespace } from "../common"

export const { namespace, config } = createNamespace({ name: "netbird" })

export const managementDomain = config.require("management-domain")
export const dashboardDomain = config.require("dashboard-domain")
export const signalDomain = config.require("signal-domain")
export const dnsDomain = config.require("dns-domain")

export const encryptionKey = config.requireSecret("encryption-key")

export const turnPassword = config.requireSecret("turn-password")

export const zitadelUrl = config.require("zitadel-url")
export const zitadelClientId = config.require("zitadel-client-id")

export const zitadelServiceUserName = config.require("zitadel-service-user-name")
export const zitadelServiceUserPassword = config.requireSecret("zitadel-service-user-password")

// export const externalIp = config.require("external-ip")

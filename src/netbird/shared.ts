import { createNamespace } from "../common"

export const { namespace, config } = createNamespace({ name: "netbird" })

export const domain = config.require("domain")
export const dnsDomain = config.require("dns-domain")
export const encryptionKey = config.requireSecret("encryption-key")

export const turnPassword = config.requireSecret("turn-password")

export const authClientId = config.require("auth-client-id")
export const authClientSecret = config.requireSecret("auth-client-secret")
export const authZitadelUrl = config.require("auth-zitadel-url")

export const externalIp = config.require("external-ip")

import { memoizeForNamespace } from "./utils"
import { cilium } from "@infra/cilium"

export const createAllowAlpineRegistryPolicy = memoizeForNamespace(namespace => {
  return cilium.createAllowWebPolicy({
    name: "allow-alpine-registry",
    namespace,

    description: "Allow Alpine registry to backup container images",

    domain: "dl-cdn.alpinelinux.org",
  })
})

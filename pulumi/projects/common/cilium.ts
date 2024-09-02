import { k8s } from "@infra/k8s"
import { memoize } from "./utils"
import { cilium } from "@infra/cilium"

export const createAllowAlpineRegistryPolicy = memoize((namespace: k8s.raw.core.v1.Namespace) => {
  return cilium.createAllowWebPolicy({
    name: "allow-alpine-registry",
    namespace,

    description: "Allow Alpine registry to backup container images",

    domain: "dl-cdn.alpinelinux.org",
  })
})

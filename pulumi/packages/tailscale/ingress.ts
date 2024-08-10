import { k8s } from "@infra/k8s"

export interface IngressOptions extends Omit<k8s.IngressOptions, "className"> {}

export function createIngress(options: IngressOptions) {
  return k8s.createIngress({ ...options, className: "tailscale" })
}

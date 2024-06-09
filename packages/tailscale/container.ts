import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export function createContainerSpec(
  hostname: string,
  extra?: Partial<k8s.raw.types.input.core.v1.Container>,
): k8s.raw.types.input.core.v1.Container {
  return {
    name: "tailscale",
    image: "ghcr.io/tailscale/tailscale:latest",

    ...extra,

    env: pulumi.output(extra?.env ?? []).apply(env => [
      {
        name: "TS_AUTHKEY",
        valueFrom: {
          secretKeyRef: {
            name: "tailscale-auth",
            key: "authKey",
          },
        },
      },
      {
        name: "TS_AUTH_ONCE",
        value: "true",
      },
      {
        name: "TS_USERSPACE",
        value: "false",
      },
      {
        name: "TS_HOSTNAME",
        value: hostname,
      },
      {
        name: "TS_KUBE_SECRET",
        value: "",
      },
      ...env,
    ]),
    securityContext: {
      capabilities: {
        add: ["NET_ADMIN"],
      },
    },
  }
}

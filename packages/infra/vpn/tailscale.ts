import { DeploymentOptions, createDeployment } from "./deployment"

export type TailscaleDeploymentOptions = Omit<DeploymentOptions, "frontendInterface" | "frontendContainer" | "volumes">

export function createTailscaleDeployment(options: TailscaleDeploymentOptions) {
  return createDeployment({
    ...options,

    frontendInterface: "tailscale0",

    frontendContainer: {
      name: "tailscale",
      image: "ghcr.io/tailscale/tailscale:latest",

      env: [
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
          name: "TS_USERSPACE",
          value: "false",
        },
        {
          name: "TS_HOSTNAME",
          value: options.location.name,
        },
        {
          name: "TS_KUBE_SECRET",
          value: "",
        },
        {
          name: "TS_EXTRA_ARGS",
          value: "--advertise-exit-node",
        },
      ],

      securityContext: {
        capabilities: {
          add: ["NET_ADMIN"],
        },
      },
    },
  })
}

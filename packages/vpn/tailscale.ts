import { k8s } from "@infra/k8s"
import { DeploymentOptions, createDeployment } from "./deployment"

export type TailscaleDeploymentOptions = Omit<DeploymentOptions, "frontendInterface" | "frontendContainer" | "volumes">

export function createTailscaleDeployment(options: TailscaleDeploymentOptions) {
  const stateVolumeClaim = k8s.createPersistentVolumeClaim({
    name: `vpn-${options.location.name}-state`,
    namespace: options.namespace,

    capacity: "10Mi",
  })

  return createDeployment({
    ...options,

    frontendInterface: "tailscale0",

    volumes: [
      {
        name: stateVolumeClaim.metadata.name,
        persistentVolumeClaim: {
          claimName: stateVolumeClaim.metadata.name,
        },
      },
    ],

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
          name: "TS_STATE_DIR",
          value: "/var/lib/tailscale",
        },
        {
          name: "TS_EXTRA_ARGS",
          value: "--advertise-exit-node",
        },
      ],

      volumeMounts: [
        {
          name: stateVolumeClaim.metadata.name,
          mountPath: "/var/lib/tailscale",
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

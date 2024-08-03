import { pulumi } from "@infra/core"
import { DeploymentOptions, createDeployment } from "./deployment"
import { tailscale } from "@infra/tailscale"

export type TailscaleDeploymentOptions = Omit<
  DeploymentOptions,
  "frontendInterface" | "frontendContainer" | "volumes" | "serviceAccount"
> & {
  /**
   * The tailscale auth key.
   */
  authKey: pulumi.Input<string>
}

export function createTailscaleDeployment(options: TailscaleDeploymentOptions) {
  const { container, serviceAccount } = tailscale.createContainer({
    secretName: options.location.name,
    namespace: options.namespace,
    authKey: options.authKey,
    hostname: options.location.name,
    advertiseExitNode: true,
  })

  return createDeployment({
    ...options,

    frontendInterface: "tailscale0",
    serviceAccount,

    frontendContainer: container,
  })
}

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

  /**
   * The JSON-serialized content of the auth secret (the content of the `data`).
   * If not provided, the secret will be created with the `authKey` and populated in the first run.
   */
  authState?: pulumi.Input<string | undefined>
}

export function createTailscaleDeployment(options: TailscaleDeploymentOptions) {
  const { container, serviceAccount } = tailscale.createContainer({
    secretName: options.location.name,
    namespace: options.namespace,
    authKey: options.authKey,
    hostname: options.location.name,
    authState: options.authState,
    advertiseExitNode: true,
  })

  return createDeployment({
    ...options,

    frontendInterface: "tailscale0",
    serviceAccount,

    frontendContainer: container,
  })
}

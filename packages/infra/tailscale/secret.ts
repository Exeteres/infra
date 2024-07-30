import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export type AuthSecretOptions = k8s.CommonOptions & {
  /**
   * The value of the secret.
   */
  value: pulumi.Input<string>
}

export function createAuthSecret(options: AuthSecretOptions) {
  return k8s.createSecret({
    ...options,
    realName: "tailscale-auth",
    key: "authKey",
    value: options.value,
  })
}

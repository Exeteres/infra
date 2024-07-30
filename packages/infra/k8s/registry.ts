import { pulumi } from "@infra/core"
import { createSecret } from "./secret"
import { CommonOptions } from "./options"

interface GhcrRegistryOptions extends CommonOptions {
  /**
   * The GitHub Container Registry access token.
   */
  accessToken: pulumi.Input<string>
}

/**
 * Creates a secret for the GitHub Container Registry which can be used to pull images from the registry.
 *
 * @param options The options for the secret.
 * @returns The secret.
 */
export function createGhcrRegistrySecret(options: GhcrRegistryOptions) {
  return createSecret({
    ...options,

    type: "kubernetes.io/dockerconfigjson",
    key: ".dockerconfigjson",

    value: pulumi.output(options.accessToken).apply(token => {
      return JSON.stringify({
        auths: {
          "ghcr.io": {
            auth: Buffer.from(`ghcr-token:${token}`).toString("base64"),
          },
        },
      })
    }),
  })
}

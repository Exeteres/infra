import { pulumi } from "@infra/core"
import { CommonOptions } from "./options"
import { createSecret } from "./secret"

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

import { CommonAppOptions, createHelmChart, createPasswordSecret, k8s } from "@infra/k8s"

interface FactorioAppOptions extends CommonAppOptions {
  /**
   * The password secret to use for the Factorio Game Server.
   * If not provided, a new secret will be created.
   * The key must be `game_password`.
   */
  passwordSecret?: k8s.core.v1.Secret

  /**
   * The list of admin usernames for the Factorio Game Server.
   */
  admins: string[]
}

/**
 * Creates a ready-to-use Factorio Game Server application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createFactorioApp(options: FactorioAppOptions) {
  let passwordSecret = options.passwordSecret

  passwordSecret ??= createPasswordSecret({
    name: "server-password",
    namespace: options.namespace,

    key: "game_password",
    length: 8,
  })

  const factorioChart = createHelmChart({
    name: options.name ?? "factorio",
    namespace: options.namespace,

    chart: "factorio-server-charts",
    repo: "https://sqljames.github.io/factorio-server-charts/",
    version: "1.2.5",

    values: {
      nodeSelector: options.nodeSelector,

      image: {
        tag: "1.1.107",
      },

      rcon: {
        external: false,
      },

      serverPassword: {
        passwordSecret: passwordSecret.metadata.name,
      },

      admin_list: options.admins,
    },
  })

  return { factorioChart }
}

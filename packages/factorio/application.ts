import { merge } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface FactorioOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The password secret to use for the Factorio Game Server.
   * If not provided, a new secret will be created.
   * The key must be `game_password`.
   */
  passwordSecret?: k8s.raw.core.v1.Secret

  /**
   * The list of admin usernames for the Factorio Game Server.
   */
  admins: string[]
}

export interface FactorioApplication extends k8s.ReleaseApplication {}

/**
 * Creates a ready-to-use Factorio Game Server application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: FactorioOptions): FactorioApplication {
  const name = options.name ?? "factorio"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const passwordSecret =
    options.passwordSecret ??
    k8s.createPasswordSecret({
      name: `${fullName}-server-password`,
      namespace,

      key: "game_password",
      length: 8,
    })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    chart: "factorio-server-charts",
    repo: "https://sqljames.github.io/factorio-server-charts/",
    version: "1.2.5",

    ...options.releaseOptions,

    values: merge(
      {
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
      options.releaseOptions?.values ?? {},
    ),
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,
    release,
  }
}

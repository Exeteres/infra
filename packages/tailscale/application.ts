import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The client ID provided by Tailscale.
   */
  clientId: pulumi.Input<string>

  /**
   * The client secret provided by Tailscale.
   */
  clientSecret: pulumi.Input<string>
}

export interface Application extends k8s.ReleaseApplication {}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "tailscale"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const secret = k8s.createSecret({
    name: k8s.getPrefixedName("operator-oauth", fullName),
    namespace,

    realName: "operator-oauth",

    data: {
      client_id: options.clientId,
      client_secret: options.clientSecret,
    },
  })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    dependsOn: [secret],

    chart: "tailscale-operator",
    repo: "https://pkgs.tailscale.com/helmcharts",
    version: "1.66.4",
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,
    release,
  }
}

import { merge } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {}

export interface Application extends k8s.ReleaseApplication {}

/**
 * Creates a PostgreSQL database using the Bitnami Helm chart.
 *
 * @param options The options for the PostgreSQL database.
 * @returns The PostgreSQL database release and certificate.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "postgresql"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    repo: "https://charts.bitnami.com/bitnami",
    chart: "postgresql",
    version: "15.4.0",

    ...options.releaseOptions,

    values: merge(
      {
        fullnameOverride: name,

        volumePermissions: {
          enabled: true,
        },

        primary: {
          nodeSelector: options.nodeSelector,

          persistence: {
            size: "400Mi",
          },
        },
      },
      options.releaseOptions?.values ?? {},
    ),
  })

  return {
    name,
    fullName,
    prefix: options.prefix,
    namespace,
    release,
  }
}

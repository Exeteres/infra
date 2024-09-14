import { merge } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {}
export interface Application extends k8s.ReleaseApplication {}

export function createApplication(options: ApplicationOptions = {}): Application {
  const name = "traefik"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const release = k8s.createHelmRelease({
    name,
    namespace,

    chart: "traefik",
    repo: "https://traefik.github.io/charts",
    version: "31.0.0",

    ...options.release,

    values: merge(
      {
        globalArguments: [
          // Disable telemetry
          "--global.checknewversion=false",
          "--global.sendanonymoususage=false",
        ],
      },
      options.release?.values ?? {},
    ),
  })

  return {
    namespace,
    release,
  }
}

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
    version: "30.0.2",

    ...options.release,

    values: options.release?.values,
  })

  return {
    namespace,
    release,
  }
}

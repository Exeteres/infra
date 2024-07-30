import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {}
export interface Application extends k8s.ReleaseApplication {}

export function createApplication(options: ApplicationOptions = {}): Application {
  const name = options.name ?? "traefik"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    chart: "traefik",
    repo: "https://traefik.github.io/charts",
    version: "29.0.1",

    ...options.release,

    values: options.release?.values,
  })

  return {
    name,
    prefix: options.prefix,
    fullName,
    namespace,
    release,
  }
}

import * as k8s from "@pulumi/kubernetes"
import { Input, Resource } from "@pulumi/pulumi"

interface HelmOptions {
  name: string
  namespace: k8s.core.v1.Namespace

  repo: string
  chart: string

  values?: Input<Record<string, unknown>>
  dependsOn?: Input<Resource>[] | Input<Resource>
}

export const createHelmChart = ({ name, namespace, repo, chart, values, dependsOn }: HelmOptions) => {
  return new k8s.helm.v3.Chart(
    name,
    {
      namespace: namespace.metadata.name,
      fetchOpts: { repo },
      chart: chart,
      values: values,
    },
    { parent: namespace, dependsOn: dependsOn },
  )
}

export const createHelmRelease = ({ name, namespace, repo, chart, values, dependsOn }: HelmOptions) => {
  return new k8s.helm.v3.Release(
    name,
    {
      name,
      namespace: namespace.metadata.name,
      repositoryOpts: { repo },
      chart: chart,
      values: values,
    },
    { parent: namespace, dependsOn: dependsOn },
  )
}

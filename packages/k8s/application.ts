import { PartialKeys, pulumi } from "@infra/core"
import { CommonOptions, NodeSelector } from "./options"
import { HelmOptions } from "./helm"
import { raw } from "./imports"
import { k8s } from "."

export interface ApplicationOptions extends PartialKeys<CommonOptions, "name" | "namespace"> {
  /**
   * The node selector to deploy the application.
   * All components will be deployed to the same node unless specified otherwise.
   */
  nodeSelector?: NodeSelector

  /**
   * The prefix of the application.
   * Can be used to prevent conflicts with resources from other applications with the same name.
   */
  prefix?: string
}

export type ChildComponentOptions<TOptions> = Omit<TOptions, "name" | "namespace">

export interface ReleaseApplicationOptions extends ApplicationOptions {
  /**
   * The extra options to pass to the Helm release.
   */
  release?: Partial<HelmOptions>
}

export interface ChartApplicationOptions extends ApplicationOptions {
  /**
   * The extra options to pass to the Helm chart.
   */
  chartOptions?: HelmOptions
}

export interface Application {
  /**
   * The name of the application.
   */
  name: string

  /**
   * The prefix of the application.
   * Can be used to prevent conflicts with resources from other applications with the same name.
   */
  prefix?: string

  /**
   * The full name of the application.
   * If a prefix is provided, the full name is `${prefix}-${name}`.
   * Otherwise, the full name is the same as the name.
   */
  fullName: string

  /**
   * The namespace where the application is deployed.
   */
  namespace: raw.core.v1.Namespace
}

export interface ReleaseApplication extends Application {
  /**
   * The Helm release deployed by the application.
   */
  release: raw.helm.v3.Release
}

export interface ChartApplication extends Application {
  /**
   * The Helm chart deployed by the application.
   */
  chart: raw.helm.v3.Chart
}

export function getPrefixedName(name: string, prefix?: string): string {
  return prefix ? `${prefix}-${name}` : name
}

export function getResourceId(name: string, namespace: k8s.raw.core.v1.Namespace): pulumi.Output<string> {
  return pulumi.interpolate`${namespace.metadata.name}/${name}`
}

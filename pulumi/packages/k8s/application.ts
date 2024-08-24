import { HelmOptions } from "./helm"
import { raw } from "./imports"

export interface ApplicationOptions {
  /**
   * The namespace to deploy the application into.
   */
  namespace?: raw.core.v1.Namespace
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
  chart?: HelmOptions
}

export interface Application {
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

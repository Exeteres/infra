import { k8s } from "@infra/k8s"

export interface Environment {
  /**
   * The pre-install scripts that should be run before installing packages.
   * Typically, these scripts are used to install additional repositories.
   */
  preInstallScripts?: Record<string, string>

  /**
   * The packages that are available in the environment.
   */
  packages?: string[]

  /**
   * The setup scripts that should be run before the script.
   */
  setupScripts?: Record<string, string>

  /**
   * The cleanup scripts that should be run after the script.
   */
  cleanupScripts?: Record<string, string>

  /**
   * The arbitrary scripts available in the environment.
   */
  scripts?: Record<string, string>

  /**
   * The volumes that should be defined in the environment.
   */
  volumes?: k8s.WorkloadVolume[]

  /**
   * The volume mounts that should be defined in the environment.
   */
  volumeMounts?: k8s.ContainerVolumeMount[]

  /**
   * The environment variables that should be defined in the environment.
   */
  environment?: k8s.ContainerEnvironment
}

/**
 * Merges multiple environments into a single environment.
 */
export function mergeEnvironments(...environments: (Environment | undefined | null)[]): Required<Environment> {
  const resolvedEnvironments = environments.filter(env => env != null) as Environment[]

  if (!resolvedEnvironments.length) {
    throw new Error("At least one environment must be provided")
  }

  const merged: Required<Environment> = {
    preInstallScripts: {},
    packages: [],
    setupScripts: {},
    cleanupScripts: {},
    scripts: {},
    volumes: [],
    volumeMounts: [],
    environment: {},
  }

  for (const env of resolvedEnvironments) {
    Object.assign(merged.preInstallScripts, env.preInstallScripts)
    merged.packages.push(...(env.packages ?? []))
    Object.assign(merged.setupScripts, env.setupScripts)
    Object.assign(merged.cleanupScripts, env.cleanupScripts)
    Object.assign(merged.scripts, env.scripts)
    merged.volumes.push(...(env.volumes ?? []))
    merged.volumeMounts.push(...(env.volumeMounts ?? []))
    Object.assign(merged.environment, env.environment)
  }

  return merged
}

import { k8s } from "@infra/k8s"

export type ScriptDistro = "alpine" | "ubuntu"

export interface ScriptEnvironment {
  /**
   * The distribution of the environment.
   * For now, only "alpine" and "ubuntu" are supported.
   */
  distro: ScriptDistro

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
  volumeMounts?: k8s.raw.types.input.core.v1.VolumeMount[]

  /**
   * The environment variables that should be defined in the environment.
   */
  environment?: k8s.ContainerEnvironment
}

/**
 * Merges multiple environments into a single environment.
 */
export function mergeEnvironments(...environments: (ScriptEnvironment | undefined | null)[]): ScriptEnvironment {
  const resolvedEnvironments = environments.filter(env => env != null) as ScriptEnvironment[]

  if (!resolvedEnvironments.length) {
    throw new Error("At least one environment must be provided")
  }

  if (resolvedEnvironments.length === 1) {
    return resolvedEnvironments[0]
  }

  const merged: Required<ScriptEnvironment> = {
    distro: resolvedEnvironments[0].distro,
    preInstallScripts: resolvedEnvironments[0].preInstallScripts ?? {},
    packages: resolvedEnvironments[0].packages ?? [],
    setupScripts: resolvedEnvironments[0].setupScripts ?? {},
    cleanupScripts: resolvedEnvironments[0].cleanupScripts ?? {},
    scripts: resolvedEnvironments[0].scripts ?? {},
    volumes: resolvedEnvironments[0].volumes ?? [],
    volumeMounts: resolvedEnvironments[0].volumeMounts ?? [],
    environment: resolvedEnvironments[0].environment ?? {},
  }

  for (const env of resolvedEnvironments.slice(1)) {
    if (env.distro !== merged.distro) {
      throw new Error("All environments must have the same distribution")
    }

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

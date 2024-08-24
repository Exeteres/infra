import { k8s } from "@infra/k8s"
import { Environment, mergeEnvironments } from "./environment"
import { trimIndentation } from "@infra/core"

export interface BundleOptions extends k8s.CommonOptions {
  /**
   * The environment to bundle the scripts from.
   */
  environment?: Environment

  /**
   * The environments to bundle the scripts from.
   */
  environments?: Environment[]
}

export interface Bundle {
  /**
   * The config map containing the scripts.
   */
  configMap: k8s.raw.core.v1.ConfigMap

  /**
   * The volumes that should be included in the workload.
   */
  volumes: k8s.WorkloadVolume[]

  /**
   * The volume mounts that should be defined in the container.
   */
  volumeMounts: k8s.ContainerVolumeMount[]

  /**
   * The environment variables that should be defined in the container.
   */
  environment: k8s.ContainerEnvironment
}

/**
 * Bundles all the scripts from the given environment into a config map.
 *
 * @param options The bundle options.
 * @returns The bundle containing the config map and the environment.
 */
export function createBundle(options: BundleOptions): Bundle {
  const scriptData: Record<string, string> = {}
  const actions: string[] = []

  const environment = mergeEnvironments(options.environment, ...(options.environments ?? []))

  if (Object.keys(environment.preInstallScripts).length > 0) {
    for (const key in environment.preInstallScripts) {
      scriptData[`pre-install-${key}`] = environment.preInstallScripts[key]

      actions.push(`
        echo "+ Running pre-install script '${key}'..."
        /scripts/pre-install-${key}
        echo "+ Pre-install script '${key}'... Done"
      `)
    }
  }

  if (environment.packages.length > 0) {
    scriptData["install-packages.sh"] = trimIndentation(`
      #!/bin/sh
      set -e
  
      apk add --no-cache ${environment.packages.join(" ")} 
    `)

    actions.push(`
      echo "+ Installing packages..."
      /scripts/install-packages.sh
      echo "+ Packages installed successfully"
    `)
  }

  if (Object.keys(environment.setupScripts).length > 0) {
    for (const key in environment.setupScripts) {
      scriptData[`setup-${key}`] = environment.setupScripts[key]

      actions.push(`
        echo "+ Running setup script '${key}'..."
        /scripts/setup-${key}
        echo "+ Setup script '${key}'... Done"
      `)
    }
  }

  if (Object.keys(environment.cleanupScripts).length > 0) {
    const cleanupActions: string[] = []

    for (const key in environment.cleanupScripts) {
      scriptData[`cleanup-${key}`] = environment.cleanupScripts[key]

      cleanupActions.push(`
        echo "+ Running cleanup script '${key}'..."
        /scripts/cleanup-${key}
        echo "+ Cleanup script '${key}'... Done"
      `)
    }

    actions.push(`
      function cleanup() {
      ${cleanupActions.map(s => s.trim()).join("\n\n")}
      }

      trap cleanup EXIT
      trap cleanup SIGTERM
    `)
  }

  for (const key in environment.scripts) {
    scriptData[key] = environment.scripts[key]
  }

  scriptData["entrypoint.sh"] = trimIndentation(`
    #!/bin/sh
    set -e

    if [ -z "\$1" ]; then
      echo "Usage: entrypoint.sh <main script> [args...]"
      exit 1
    fi

  ${actions.map(s => s.trim()).join("\n\n")}

    echo "+ Running main script..."
    \$@
    echo "+ Main script completed"
  `)

  const configMap = k8s.createConfigMap({
    name: k8s.getPrefixedName("scripts", options.name),
    namespace: options.namespace,

    data: scriptData,
  })

  return {
    configMap,
    environment: environment.environment,

    volumes: [
      ...environment.volumes,
      {
        name: configMap.metadata.name,

        configMap: {
          name: configMap.metadata.name,
          defaultMode: 0o550, // read and execute permissions
        },
      },
    ],

    volumeMounts: [
      ...environment.volumeMounts,
      {
        volume: configMap,
        mountPath: "/scripts",
      },
    ],
  }
}

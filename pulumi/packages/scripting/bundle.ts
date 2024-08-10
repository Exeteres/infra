import { k8s } from "@infra/k8s"
import { ScriptEnvironment, mergeEnvironments } from "./environment"
import { trimIndentation } from "@infra/core"

export interface BundleOptions extends k8s.CommonOptions {
  /**
   * The script environment to use.
   */
  environment: ScriptEnvironment

  /**
   * Extra scripts to include in the bundle.
   */
  scripts?: Record<string, string>
}

export interface Bundle {
  /**
   * The config map containing the scripts.
   */
  configMap: k8s.raw.core.v1.ConfigMap

  /**
   * The environment used by the scripts.
   */
  environment: ScriptEnvironment
}

/**
 * Creates a config map with the given scripts and environment.
 */
export function createBundle(options: BundleOptions): Bundle {
  const scriptData: Record<string, string> = {}
  const actions: string[] = []

  const environment = options.scripts
    ? mergeEnvironments(options.environment, { distro: options.environment.distro, scripts: options.scripts })
    : options.environment

  if (environment.preInstallScripts && Object.keys(environment.preInstallScripts).length > 0) {
    for (const key in environment.preInstallScripts) {
      scriptData[`pre-install-${key}`] = environment.preInstallScripts[key]

      actions.push(`
        echo "+ Running pre-install script '${key}'..."
        /scripts/pre-install-${key}
        echo "+ Pre-install script '${key}'... Done"
      `)
    }
  }

  if (environment.packages && environment.packages.length > 0) {
    scriptData["install-packages.sh"] = getInstallPackagesScript(environment)

    actions.push(`
      echo "+ Installing packages..."
      /scripts/install-packages.sh
      echo "+ Packages installed successfully"
    `)
  }

  if (environment.setupScripts && Object.keys(environment.setupScripts).length > 0) {
    for (const key in environment.setupScripts) {
      scriptData[`setup-${key}`] = environment.setupScripts[key]

      actions.push(`
        echo "+ Running setup script '${key}'..."
        /scripts/setup-${key}
        echo "+ Setup script '${key}'... Done"
      `)
    }
  }

  if (environment.cleanupScripts && Object.keys(environment.cleanupScripts).length > 0) {
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
        ${cleanupActions.join("\n\n")}
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

    ${actions.join("\n\n")}

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
    environment,
  }
}

function getInstallPackagesScript(environment: ScriptEnvironment) {
  if (!environment.packages) {
    return ""
  }

  switch (environment.distro) {
    case "alpine":
      return trimIndentation(`
          #!/bin/sh
          set -e
  
          apk add --no-cache ${environment.packages?.join(" ")}
        `)
    case "ubuntu":
      return trimIndentation(`
          #!/bin/sh
          set -e
  
          apt-get update
          apt-get install -y ${environment.packages?.join(" ")}
        `)
    default:
      throw new Error(`Unsupported distro: ${environment.distro}`)
  }
}

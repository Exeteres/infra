import { k8s } from "@infra/k8s"
import { ScriptEnvironment } from "./environment"
import { trimIndentation } from "@infra/core"

export interface BundleOptions extends k8s.CommonOptions {
  /**
   * The script environment to use.
   */
  environment: ScriptEnvironment
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

  if (options.environment.preInstallScripts && Object.keys(options.environment.preInstallScripts).length > 0) {
    for (const key in options.environment.preInstallScripts) {
      scriptData[`pre-install-${key}`] = options.environment.preInstallScripts[key]

      actions.push(`
        echo "+ Running pre-install script '${key}'..."
        /scripts/pre-install-${key}
        echo "+ Pre-install script '${key}'... Done"
      `)
    }
  }

  if (options.environment.packages && options.environment.packages.length > 0) {
    scriptData["install-packages.sh"] = getInstallPackagesScript(options.environment)

    actions.push(`
      echo "+ Installing packages..."
      /scripts/install-packages.sh
      echo "+ Packages installed successfully"
    `)
  }

  if (options.environment.setupScripts && Object.keys(options.environment.setupScripts).length > 0) {
    for (const key in options.environment.setupScripts) {
      scriptData[`setup-${key}`] = options.environment.setupScripts[key]

      actions.push(`
        echo "+ Running setup script '${key}'..."
        /scripts/setup-${key}
        echo "+ Setup script '${key}'... Done"
      `)
    }
  }

  if (options.environment.cleanupScripts && Object.keys(options.environment.cleanupScripts).length > 0) {
    const cleanupActions: string[] = []

    for (const key in options.environment.cleanupScripts) {
      scriptData[`cleanup-${key}`] = options.environment.cleanupScripts[key]

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

  for (const key in options.environment.scripts) {
    scriptData[key] = options.environment.scripts[key]
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
    environment: options.environment,
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

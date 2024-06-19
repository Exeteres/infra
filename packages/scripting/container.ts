import { k8s } from "@infra/k8s"
import { ScriptDistro } from "./environment"
import { Bundle } from "./bundle"

export interface ContainerOptions extends k8s.CommonOptions {
  /**
   * The script bundle to use.
   */
  bundle: Bundle

  /**
   * The path to the main script file.
   * The script must be available in the bundle.
   */
  main: string
}

export interface ContainerSpec {
  /**
   * The spec of the script container.
   */
  container: k8s.raw.types.input.core.v1.Container

  /**
   * The spec of volumes which should be included in the pod.
   */
  volumes: k8s.raw.types.input.core.v1.Volume[]
}

/**
 * Creates a spec for a container that runs a script.
 * This spec can be used to create a complete workload or an init container.
 *
 * @param options The options to create the container spec.
 * @returns The container spec.
 */
export function createContainerSpec(options: ContainerOptions): ContainerSpec {
  return {
    container: {
      name: options.name,
      image: getDistroImage(options.bundle.environment.distro),
      command: ["/scripts/entrypoint.sh", options.main],

      volumeMounts: [
        {
          name: options.bundle.configMap.metadata.name,
          mountPath: "/scripts",
        },
        ...(options.bundle.environment.volumeMounts ?? []),
      ],

      env: k8s.mapEnvironment(options.bundle.environment.environment),
    },

    volumes: [
      ...(options.bundle.environment.volumes?.map(k8s.mapWorkloadVolume) ?? []),
      {
        name: options.bundle.configMap.metadata.name,
        configMap: {
          name: options.bundle.configMap.metadata.name,
          defaultMode: 0o550,
        },
      },
    ],
  }
}

function getDistroImage(distro: ScriptDistro) {
  switch (distro) {
    case "alpine":
      return "alpine:3.20"
    case "ubuntu":
      return "ubuntu:24.04"
    default:
      throw new Error(`Unsupported distro: ${distro}`)
  }
}

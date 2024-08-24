import { k8s } from "@infra/k8s"
import { Bundle } from "./bundle"
import { mergeInputArrays, mergeInputObjects } from "@infra/core"

export interface ContainerOptions extends k8s.Container {
  /**
   * The script bundle to use.
   */
  bundle: Bundle

  /**
   * The name of the main script to run.
   * The script must be available in the bundle.
   */
  main: string
}

/**
 * Creates a spec for a container that runs a script.
 * This spec can be used to create a complete workload or an init container.
 *
 * @param options The options to create the container spec.
 * @returns The container spec.
 */
export function createContainer(options: ContainerOptions): k8s.Container {
  return {
    image: "alpine:3.20",
    command: ["/scripts/entrypoint.sh", `/scripts/${options.main}`],

    ...options,

    volumeMounts: mergeInputArrays(options.bundle.volumeMounts, options.volumeMounts),
    volumes: mergeInputArrays(options.bundle.volumes, options.volumes),
    environment: mergeInputObjects(options.bundle.environment, options.environment),
  }
}

import { pulumi } from "@infra/core"
import { scripting } from "@infra/scripting"
import { ScriptBundle, createScriptBundle } from "./bundle"
import { k8s } from "@infra/k8s"
import { BackupOptions } from "./options"

export interface ExtraContainersOptions extends k8s.CommonOptions {
  /**
   * The options for the backup.
   */
  options: BackupOptions

  /**
   * The bundle to use for the backup.
   * If not provided, it will be created automatically (not recommended).
   */
  bundle?: ScriptBundle

  /**
   * The name of the volume which should be used by the init and sidecar containers.
   * It should be defined in the pod template.
   */
  volume: pulumi.Input<string>
}

export interface ContainerSpec {
  /**
   * The spec of the init containers which should be included in the pod.
   */
  initContainer: k8s.raw.types.input.core.v1.Container

  /**
   * The spec of the sidecar container which should be included in the pod.
   */
  sidecarContainer: k8s.raw.types.input.core.v1.Container

  /**
   * The spec of volumes which should be included in the pod.
   */
  volumes: k8s.raw.types.input.core.v1.Volume[]
}

/**
 * Creates the spec of the extra containers which should be included in the pod.
 *
 * This includes:
 *  - the init container which is responsible for restoring the data from the backup on startup;
 *  - the sidecar container which is responsible for running the backup script on the pod shutdown;
 *  - the volumes which are required by the init and sidecar containers.
 *
 * @param options The options to create the extra containers.
 * @returns The spec of the extra containers.
 */
export function createExtraContainers(options: ExtraContainersOptions): ContainerSpec {
  const { container: initContainer, volumes } = scripting.createContainerSpec({
    name: `${options.name}-restore`,
    namespace: options.namespace,

    bundle:
      options.bundle ??
      createScriptBundle({
        name: options.name,
        namespace: options.namespace,
        repository: options.options.repository,
      }),

    main: "/scripts/restore.sh",
  })

  const { container: sidecarContainer } = scripting.createContainerSpec({
    name: `${options.name}-backup-on-shutdown`,
    namespace: options.namespace,

    bundle:
      options.bundle ??
      createScriptBundle({
        name: options.name,
        namespace: options.namespace,
        repository: options.options.repository,
      }),

    main: "exec /scripts/backup-on-shutdown.sh",
  })

  return {
    initContainer: pulumi.output(initContainer).apply(container => ({
      ...container,
      env: [
        ...(container.env ?? []),
        {
          name: "RESTIC_HOSTNAME",
          value: options.options.hostname,
        },
      ],
      volumeMounts: [
        ...(container.volumeMounts ?? []),
        {
          name: options.volume,
          mountPath: "/data",
        },
      ],
    })) as k8s.raw.types.input.core.v1.Container,

    sidecarContainer: pulumi.output(sidecarContainer).apply(container => ({
      ...container,
      env: [
        ...(container.env ?? []),
        {
          name: "RESTIC_HOSTNAME",
          value: options.options.hostname,
        },
      ],
      volumeMounts: [
        ...(container.volumeMounts ?? []),
        {
          name: options.volume,
          mountPath: "/data",
        },
      ],
    })) as k8s.raw.types.input.core.v1.Container,

    volumes,
  }
}

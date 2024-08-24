import { Input, InputArray, mapOptional, normalizeInputsAndMap, output, Output, PartialKeys, pulumi } from "@infra/core"
import { raw } from "./imports"

export interface Container
  extends PartialKeys<Omit<raw.types.input.core.v1.Container, "volumeMounts" | "env" | "envFrom">, "name"> {
  /**
   * The map of environment variables to set in the container.
   * It is like the `env` property, but more convenient to use.
   */
  environment?: Input<ContainerEnvironment>

  /**
   * The source of environment variables to set in the container.
   * It is like the `envFrom` property, but more convenient to use.
   */
  environmentSource?: Input<ContainerEnvironmentSource>

  /**
   * The sources of environment variables to set in the container.
   * It is like the `envFrom` property, but more convenient to use.
   */
  environmentSources?: InputArray<ContainerEnvironmentSource>

  /**
   * The volume mount to attach to the container.
   */
  volumeMount?: Input<ContainerVolumeMount>

  /**
   * The volume mounts to attach to the container.
   */
  volumeMounts?: InputArray<ContainerVolumeMount>

  /**
   * The volume to include in the parent workload.
   * It is like the `volumes` property, but defined at the container level.
   */
  volume?: Input<WorkloadVolume>

  /**
   * The volumes to include in the parent workload.
   * It is like the `volumes` property, but defined at the container level.
   */
  volumes?: InputArray<WorkloadVolume>
}

export type ContainerEnvironment = Record<
  string,
  pulumi.Input<string | undefined | null | ContainerEnvironmentVariable>
>

export type ContainerEnvironmentVariable =
  | raw.types.input.core.v1.EnvVarSource
  | {
      /**
       * The secret to select from.
       */
      secret: raw.core.v1.Secret

      /**
       * The key of the secret to select from.
       */
      key: string
    }
  | {
      /**
       * The config map to select from.
       */
      configMap: raw.core.v1.ConfigMap

      /**
       * The key of the config map to select from.
       */
      key: string
    }

export type ContainerEnvironmentSource =
  | raw.types.input.core.v1.EnvFromSource
  | raw.core.v1.ConfigMap
  | raw.core.v1.Secret

export type ContainerVolumeMount =
  | raw.types.input.core.v1.VolumeMount
  | (Omit<raw.types.input.core.v1.VolumeMount, "name"> & {
      /**
       * The volume to mount.
       */
      volume: Input<WorkloadVolume>
    })

export type WorkloadVolume =
  | raw.types.input.core.v1.Volume
  | raw.core.v1.PersistentVolumeClaim
  | raw.core.v1.ConfigMap
  | raw.core.v1.Secret

export function mapContainer(container: Container, fallbackName: string): raw.types.input.core.v1.Container {
  return {
    name: container.name ?? fallbackName,

    env: mapOptional(container.environment, mapContainerEnvironment),
    envFrom: normalizeInputsAndMap(container.environmentSource, container.environmentSources, mapEnvironmentSource),
    volumeMounts: normalizeInputsAndMap(container.volumeMount, container.volumeMounts, mapVolumeMount),

    args: container.args,
    command: container.command,
    image: container.image,
    imagePullPolicy: container.imagePullPolicy,
    lifecycle: container.lifecycle,
    livenessProbe: container.livenessProbe,
    ports: container.ports,
    readinessProbe: container.readinessProbe,
    resizePolicy: container.resizePolicy,
    resources: container.resources,
    restartPolicy: container.restartPolicy,
    securityContext: container.securityContext,
    startupProbe: container.startupProbe,
    stdin: container.stdin,
    stdinOnce: container.stdinOnce,
    terminationMessagePath: container.terminationMessagePath,
    terminationMessagePolicy: container.terminationMessagePolicy,
    tty: container.tty,
    volumeDevices: container.volumeDevices,
    workingDir: container.workingDir,
  }
}

export function mapContainerEnvironment(
  environment: Input<ContainerEnvironment>,
): Output<raw.types.input.core.v1.EnvVar[]> {
  return pulumi.output(environment).apply(environment => {
    const envVars: raw.types.input.core.v1.EnvVar[] = []

    for (const [name, value] of Object.entries(environment)) {
      if (!value) {
        continue
      }

      if (typeof value === "string") {
        envVars.push({ name, value })
        continue
      }

      if ("secret" in value) {
        envVars.push({
          name,
          valueFrom: {
            secretKeyRef: {
              name: value.secret.metadata.name,
              key: value.key,
            },
          },
        })
        continue
      }

      if ("configMap" in value) {
        envVars.push({
          name,
          valueFrom: {
            configMapKeyRef: {
              name: value.configMap.metadata.name,
              key: value.key,
            },
          },
        })
        continue
      }

      envVars.push({ name, valueFrom: value })
    }

    return envVars
  })
}

export function mapEnvironmentSource(envFrom: ContainerEnvironmentSource): raw.types.input.core.v1.EnvFromSource {
  if (envFrom instanceof raw.core.v1.ConfigMap) {
    return {
      configMapRef: {
        name: envFrom.metadata.name,
      },
    }
  }

  if (envFrom instanceof raw.core.v1.Secret) {
    return {
      secretRef: {
        name: envFrom.metadata.name,
      },
    }
  }

  return envFrom
}

export function mapVolumeMount(volumeMount: ContainerVolumeMount): raw.types.input.core.v1.VolumeMount {
  if ("volume" in volumeMount) {
    return {
      ...volumeMount,
      name: output(volumeMount.volume)
        .apply(mapWorkloadVolume)
        .apply(volume => pulumi.output(volume.name)),
    }
  }

  return volumeMount
}

export function mapWorkloadVolume(volume: WorkloadVolume) {
  if (volume instanceof raw.core.v1.PersistentVolumeClaim) {
    return {
      name: volume.metadata.name,
      persistentVolumeClaim: {
        claimName: volume.metadata.name,
      },
    }
  }

  if (volume instanceof raw.core.v1.ConfigMap) {
    return {
      name: volume.metadata.name,
      configMap: {
        name: volume.metadata.name,
      },
    }
  }

  if (volume instanceof raw.core.v1.Secret) {
    return {
      name: volume.metadata.name,
      secret: {
        secretName: volume.metadata.name,
      },
    }
  }

  return volume
}

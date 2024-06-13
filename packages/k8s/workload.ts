import { PartialKeys, normalizeInputArrayAndMap, pulumi } from "@infra/core"
import { CommonOptions, NodeSelector, mapMetadata, mapPulumiOptions } from "./options"
import { raw } from "./imports"

export type WorkloadKind = "Deployment" | "StatefulSet" | "ReplicaSet" | "DaemonSet"

export interface ContainerOptions extends PartialKeys<raw.types.input.core.v1.Container, "name"> {
  /**
   * The map of environment variables to set in the container.
   * It is like the `env` property, but more convenient to use.
   */
  environment?: pulumi.Input<ContainerEnvironment>
}

export type ContainerEnvironment = Record<string, pulumi.Input<string | raw.types.input.core.v1.EnvVarSource>>

export type WorkloadResources = {
  Deployment: raw.apps.v1.Deployment
  StatefulSet: raw.apps.v1.StatefulSet
  ReplicaSet: raw.apps.v1.ReplicaSet
  DaemonSet: raw.apps.v1.DaemonSet
}

export type WorkloadVolume = raw.types.input.core.v1.Volume | raw.core.v1.PersistentVolumeClaim

export interface WorkloadOptions extends CommonOptions {
  /**
   * The kind of workload to create: Deployment, StatefulSet, ReplicaSet, or DaemonSet.
   */
  kind: WorkloadKind

  /**
   * The configuration of the container that runs in the workload.
   */
  container?: pulumi.Input<ContainerOptions>

  /**
   * The configuration of the containers that run in the workload.
   */
  containers?: pulumi.Input<pulumi.Input<ContainerOptions>[]>

  /**
   * The node selector to constrain the workload to run on specific nodes.
   */
  nodeSelector?: NodeSelector

  /**
   * The volume to define in the workload.
   */
  volume?: pulumi.Input<WorkloadVolume>

  /**
   * The volumes to define in the workload.
   */
  volumes?: pulumi.Input<pulumi.Input<WorkloadVolume>[]>

  /**
   * The number of replicas to run in the workload.
   */
  replicas?: pulumi.Input<number>

  /**
   * The affinity to define in the workload.
   */
  affinity?: pulumi.Input<raw.types.input.core.v1.Affinity>

  /**
   * The topology spread constraints to define in the workload.
   */
  topologySpreadConstraints?: pulumi.Input<raw.types.input.core.v1.TopologySpreadConstraint>[]

  /**
   * Whether to run only one replica per node.
   */
  oneReplicaPerNode?: boolean

  /**
   * The secret to use for pulling the container image.
   */
  imagePullSecret?: pulumi.Input<raw.core.v1.Secret>

  /**
   * The security context to define in the workload.
   */
  securityContext?: pulumi.Input<raw.types.input.core.v1.PodSecurityContext>

  /**
   * The service account name to use in the workload.
   */
  serviceAccountName?: pulumi.Input<string>
}

export type TypedWorkloadOptions<TWorkloadKind> = Omit<WorkloadOptions, "kind"> & { kind: TWorkloadKind }

/**
 * Creates a new workload with the specified options.
 *
 * @param options The options to create the workload.
 * @returns The workload resource.
 */
export function createWorkload<T extends WorkloadKind>(options: TypedWorkloadOptions<T>): WorkloadResources[T] {
  const labels = {
    "app.kubernetes.io/name": options.name,
    ...options.labels,
  }

  const constructor = resolveConstructor(options.kind)

  return new constructor(
    options.name,
    {
      metadata: mapMetadata(options, { labels }),
      spec: {
        serviceName: options.name,
        replicas: options.replicas,
        selector: {
          matchLabels: labels,
        },
        template: {
          metadata: mapMetadata(options, { labels }),
          spec: {
            nodeSelector: options.nodeSelector,
            affinity: options.affinity,

            serviceAccountName: options.serviceAccountName,

            topologySpreadConstraints: mapTopologySpreadConstraints(options),

            imagePullSecrets: pulumi
              .output(options.imagePullSecret)
              .apply(value => (value ? [{ name: value.metadata.name }] : [])),

            containers: normalizeInputArrayAndMap(
              //
              options.container,
              options.containers,
              c => mapWorkloadContainer(options.name, c),
            ),

            volumes: normalizeInputArrayAndMap(options.volume, options.volumes, mapWorkladVolume),

            securityContext: options.securityContext,
          },
        },
      },
    },
    mapPulumiOptions(options, {
      ignoreChanges: ["spec.template.spec.containers[*].image"],
    }),
  ) as WorkloadResources[T]
}

export function mapWorkladVolume(volume: WorkloadVolume) {
  if (volume instanceof raw.core.v1.PersistentVolumeClaim) {
    return {
      name: volume.metadata.name,
      persistentVolumeClaim: {
        claimName: volume.metadata.name,
      },
    }
  }

  return volume
}

export function mapWorkloadContainer(name: string, options: ContainerOptions) {
  return {
    ...options,

    name: options.name ?? name,
    env: options.environment ? Object.entries(options.environment).map(mapContainerEnvVar) : options.env,
  } satisfies raw.types.input.core.v1.Container
}

function mapContainerEnvVar([name, value]: [
  string,
  pulumi.Input<string | raw.types.input.core.v1.EnvVarSource>,
]): pulumi.Input<raw.types.input.core.v1.EnvVar> {
  return pulumi.output(value).apply(value => {
    if (typeof value === "string") {
      return { name, value }
    } else {
      return { name, valueFrom: value }
    }
  })
}

export function mapTopologySpreadConstraints(
  options: WorkloadOptions,
): pulumi.Input<raw.types.input.core.v1.TopologySpreadConstraint>[] {
  if (!options.oneReplicaPerNode) {
    return options.topologySpreadConstraints ?? []
  }

  return [
    {
      maxSkew: 1,
      topologyKey: "kubernetes.io/hostname",
      whenUnsatisfiable: "DoNotSchedule",
      labelSelector: {
        matchLabels: {
          "app.kubernetes.io/name": options.name,
        },
      },
    },
    ...(options.topologySpreadConstraints ?? []),
  ]
}

interface MapVolumeToMountOptions extends Omit<raw.types.input.core.v1.VolumeMount, "name"> {
  /**
   * The volume to mount.
   */
  volume: WorkloadVolume
}

/**
 * Maps a volume to a volume mount with the specified options.
 *
 * @param options The options to map the volume to a volume mount.
 * @returns The volume mount.
 */
export function mapVolumeToMount(options: MapVolumeToMountOptions): pulumi.Input<raw.types.input.core.v1.VolumeMount> {
  return pulumi.output(options.volume).apply(volume => {
    if (volume instanceof raw.core.v1.PersistentVolumeClaim) {
      return {
        ...options,
        name: volume.metadata.name,
      }
    }

    return {
      ...options,
      name: volume.name,
    }
  })
}

function resolveConstructor(kind: WorkloadKind) {
  switch (kind) {
    case "Deployment":
      return raw.apps.v1.Deployment
    case "StatefulSet":
      return raw.apps.v1.StatefulSet
    case "ReplicaSet":
      return raw.apps.v1.ReplicaSet
    case "DaemonSet":
      return raw.apps.v1.DaemonSet
  }
}

export function getRequiredServicePortByName(service: raw.core.v1.Service, name: string): pulumi.Output<number> {
  return pulumi.output(service.spec.ports).apply(ports => {
    const port = ports.find(p => p.name === name)
    if (!port) {
      throw new Error(`Service port with name '${name}' not found`)
    }

    return port.port
  })
}

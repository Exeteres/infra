import { PartialKeys, normalizeInputArrayAndMap, pulumi } from "@infra/core"
import { raw } from "./imports"
import { CommonOptions, NodeSelector, mapMetadata, mapPulumiOptions } from "./options"

type WorkloadKind = "Deployment" | "StatefulSet" | "ReplicaSet" | "DaemonSet"

interface ContainerOptions extends PartialKeys<raw.types.input.core.v1.Container, "name"> {
  /**
   * The map of environment variables to set in the container.
   * It is like the `env` property, but more convenient to use.
   */
  environment?: pulumi.Input<ContainerEnvironment>
}

export type ContainerEnvironment = Record<string, pulumi.Input<string | raw.types.input.core.v1.EnvVarSource>>

interface ServiceWorkloadOptions extends CommonOptions {
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
   * The configuration of the port that the service exposes.
   */
  port?: pulumi.Input<ServicePort>

  /**
   * The configuration of the ports that the service exposes.
   */
  ports?: pulumi.Input<pulumi.Input<ServicePort>[]>

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
}

export type ServicePort = raw.types.input.core.v1.ServicePort | number

export type WorkloadVolume = raw.types.input.core.v1.Volume | raw.core.v1.PersistentVolumeClaim

type TypedServiceOptions<TWorkloadKind> = Omit<ServiceWorkloadOptions, "kind"> & { kind: TWorkloadKind }

type WorkloadResources = {
  Deployment: raw.apps.v1.Deployment
  StatefulSet: raw.apps.v1.StatefulSet
  ReplicaSet: raw.apps.v1.ReplicaSet
  DaemonSet: raw.apps.v1.DaemonSet
}

interface ServiceResult<TWorkloadKind extends WorkloadKind> {
  /**
   * The workload resource.
   * May be a Deployment, StatefulSet, ReplicaSet, or DaemonSet.
   */
  workload: WorkloadResources[TWorkloadKind]

  /**
   * The service resource.
   */
  service: raw.core.v1.Service
}

/**
 * Creates a hybrid deployment and service entity.
 * It creates a deployment and a service that exposes the deployment.
 *
 * @param options The deployment and service options.
 * @returns The deployment and service resources.
 */
export function createWorkloadService(options: TypedServiceOptions<"Deployment">): ServiceResult<"Deployment">

/**
 * Creates a hybrid stateful set and service entity.
 * It creates a stateful set and a service that exposes the deployment.
 *
 * @param options The stateful set and service options.
 * @returns The stateful set and service resources.
 */
export function createWorkloadService(options: TypedServiceOptions<"StatefulSet">): ServiceResult<"StatefulSet">

/**
 * Creates a hybrid replica set and service entity.
 * It creates a replica set and a service that exposes the deployment.
 *
 * @param options The replica set and service options.
 * @returns The replica set and service resources.
 */
export function createWorkloadService(options: TypedServiceOptions<"ReplicaSet">): ServiceResult<"ReplicaSet">

/**
 * Creates a hybrid daemon set and service entity.
 * It creates a daemon set and a service that exposes the deployment.
 *
 * @param options The daemon set and service options.
 * @returns The daemon set and service resources.
 */
export function createWorkloadService(options: TypedServiceOptions<"DaemonSet">): ServiceResult<"DaemonSet">

export function createWorkloadService(options: ServiceWorkloadOptions) {
  const constructor = resolveConstructor(options.kind)

  const labels = {
    "app.kubernetes.io/name": options.name,
    ...options.labels,
  }

  const workload = new constructor(
    options.name,
    {
      metadata: mapMetadata(options),
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

            topologySpreadConstraints: mapTopologySpreadConstraints(options),

            imagePullSecrets: pulumi
              .output(options.imagePullSecret)
              .apply(value => (value ? [{ name: value.metadata.name }] : [])),

            containers: normalizeInputArrayAndMap(
              //
              options.container,
              options.containers,
              c => mapContainer(options.name, c),
            ),

            volumes: normalizeInputArrayAndMap(options.volume, options.volumes, mapVolume),
          },
        },
      },
    },
    mapPulumiOptions(options, {
      ignoreChanges: ["spec.template.spec.containers[*].image"],
    }),
  )

  const service = new raw.core.v1.Service(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        selector: labels,
        ports: normalizeInputArrayAndMap(options.port, options.ports, mapPort),
      },
    },
    mapPulumiOptions(options),
  )

  return { workload, service }
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

function mapContainer(name: string, options: ContainerOptions) {
  return {
    ...options,

    name: options.name ?? name,
    env: options.environment ? Object.entries(options.environment).map(mapEnvVar) : options.env,
  } satisfies raw.types.input.core.v1.Container
}

function mapEnvVar([name, value]: [
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

function mapPort(port: ServicePort): raw.types.input.core.v1.ServicePort {
  if (typeof port === "number") {
    return { port }
  } else {
    return port
  }
}

function mapVolume(volume: WorkloadVolume) {
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

function mapTopologySpreadConstraints(
  options: ServiceWorkloadOptions,
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

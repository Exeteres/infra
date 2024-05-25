import { PartialKeys, normalizeInputArray, normalizeInputArrayAndMap, pulumi } from "@infra/core"
import { k8s } from "./imports"
import { CommonOptions, NodeSelectorInput, mapMetadata, mapPulumiOptions } from "./options"

type WorkloadKind = "Deployment" | "StatefulSet" | "ReplicaSet" | "DaemonSet"

interface ContainerOptions extends PartialKeys<k8s.types.input.core.v1.Container, "name"> {
  /**
   * The map of environment variables to set in the container.
   * It is like the `env` property, but more convenient to use.
   */
  environment?: Record<string, pulumi.Input<string | k8s.types.input.core.v1.EnvVarSource>>
}

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
  port?: pulumi.Input<k8s.types.input.core.v1.ServicePort>

  /**
   * The configuration of the ports that the service exposes.
   */
  ports?: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.ServicePort>[]>

  /**
   * The node selector to constrain the workload to run on specific nodes.
   */
  nodeSelector?: NodeSelectorInput

  /**
   * The volume to define in the workload.
   */
  volume?: pulumi.Input<k8s.types.input.core.v1.Volume>

  /**
   * The volumes to define in the workload.
   */
  volumes?: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.Volume>[]>

  /**
   * The number of replicas to run in the workload.
   */
  replicas?: pulumi.Input<number>
}

type TypedServiceOptions<TWorkloadKind> = Omit<ServiceWorkloadOptions, "kind"> & { kind: TWorkloadKind }

type WorkloadResources = {
  Deployment: k8s.apps.v1.Deployment
  StatefulSet: k8s.apps.v1.StatefulSet
  ReplicaSet: k8s.apps.v1.ReplicaSet
  DaemonSet: k8s.apps.v1.DaemonSet
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
  service: k8s.core.v1.Service
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
            containers: normalizeInputArrayAndMap(
              //
              options.container,
              options.containers,
              c => mapContainer(options.name, c),
            ),
            volumes: normalizeInputArray(options.volume, options.volumes),
          },
        },
      },
    },
    mapPulumiOptions(options),
  )

  const service = new k8s.core.v1.Service(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        selector: labels,
        ports: normalizeInputArray(options.port, options.ports),
      },
    },
    mapPulumiOptions(options),
  )

  return { workload, service }
}

function resolveConstructor(kind: WorkloadKind) {
  switch (kind) {
    case "Deployment":
      return k8s.apps.v1.Deployment
    case "StatefulSet":
      return k8s.apps.v1.StatefulSet
    case "ReplicaSet":
      return k8s.apps.v1.ReplicaSet
    case "DaemonSet":
      return k8s.apps.v1.DaemonSet
  }
}

function mapContainer(name: string, options: ContainerOptions) {
  return {
    ...options,

    name: options.name ?? name,
    env: options.environment ? Object.entries(options.environment).map(mapEnvVar) : options.env,
  } satisfies k8s.types.input.core.v1.Container
}

function mapEnvVar([name, value]: [
  string,
  pulumi.Input<string | k8s.types.input.core.v1.EnvVarSource>,
]): pulumi.Input<k8s.types.input.core.v1.EnvVar> {
  return pulumi.output(value).apply(value => {
    if (typeof value === "string") {
      return { name, value }
    } else {
      return { name, valueFrom: value }
    }
  })
}

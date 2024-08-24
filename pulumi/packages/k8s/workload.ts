import { flattenInputs, Input, InputArray, mapInputs, mergeInputArrays, normalizeInputs } from "@infra/core"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { raw } from "./imports"
import { Container, mapContainer, mapWorkloadVolume, WorkloadVolume } from "./container"

export type WorkloadKind = keyof WorkloadResources

export type WorkloadResources = {
  Deployment: raw.apps.v1.Deployment
  StatefulSet: raw.apps.v1.StatefulSet
  ReplicaSet: raw.apps.v1.ReplicaSet
  DaemonSet: raw.apps.v1.DaemonSet
}

export type WorkloadResourceArgs = {
  Deployment: raw.types.input.apps.v1.DeploymentSpec
  StatefulSet: raw.types.input.apps.v1.StatefulSetSpec
  ReplicaSet: raw.types.input.apps.v1.ReplicaSetSpec
  DaemonSet: raw.types.input.apps.v1.DaemonSetSpec
}

export type WorkloadOptionsBase<TResourceArgs> = CommonOptions &
  Omit<TResourceArgs, "volumes" | "template"> &
  Omit<raw.types.input.core.v1.PodSpec, "containers" | "initContainers" | "volumeMounts"> & {
    /**
     * The container to run in the workload.
     */
    container?: Input<Container>

    /**
     * The containers to run in the workload.
     */
    containers?: InputArray<Container>

    /**
     * The init container to run in the workload.
     */
    initContainer?: Input<Container>

    /**
     * The init containers to run in the workload.
     */
    initContainers?: InputArray<Container>

    /**
     * The volume to include in the workload.
     */
    volume?: Input<WorkloadVolume>

    /**
     * The volumes to include in the workload.
     */
    volumes?: InputArray<WorkloadVolume>
  }

export type WorkloadOptions<TWorkloadKind extends WorkloadKind> = WorkloadOptionsBase<
  Omit<WorkloadResourceArgs[TWorkloadKind], "selector">
> & {
  /**
   * The kind of workload to create: Deployment, StatefulSet, ReplicaSet, or DaemonSet.
   */
  kind: TWorkloadKind
}

/**
 * Creates a new workload with the specified options.
 *
 * @param options The options to create the workload.
 * @returns The workload resource.
 */
export function createWorkload<T extends WorkloadKind>(options: WorkloadOptions<T>): WorkloadResources[T] {
  const labels = {
    "app.kubernetes.io/name": options.name,
    ...options.labels,
  }

  const podTemplate: raw.types.input.core.v1.PodTemplateSpec = createPodTemplate({ ...options, labels })

  const workloadSpec = { ...options }
  // @ts-ignore
  delete workloadSpec.kind
  delete workloadSpec.container
  delete workloadSpec.containers
  delete workloadSpec.initContainer
  delete workloadSpec.initContainers
  delete workloadSpec.volume
  delete workloadSpec.volumes

  const constructor = resolveConstructor(options.kind)

  return new constructor(
    options.name,
    {
      metadata: mapMetadata(options, { labels }),
      spec: {
        ...workloadSpec,
        template: podTemplate,
        selector: {
          matchLabels: labels,
        },
      } as any,
    },
    mapPulumiOptions(options, {
      ignoreChanges: ["spec.template.spec.containers[*].image"],
    }),
  ) as WorkloadResources[T]
}

export function createPodTemplate<T>(
  options: WorkloadOptionsBase<T>,
  defaultRestartPolicy?: string,
): raw.types.input.core.v1.PodTemplateSpec {
  const containers = normalizeInputs(options.container, options.containers)
  const initContainers = normalizeInputs(options.initContainer, options.initContainers)

  return {
    metadata: mapMetadata(options),
    spec: {
      containers: mapInputs(containers, (container, index, all) => {
        const fallbackName = all.length === 1 ? options.name : `${options.name}-${index}`

        return mapContainer(container, fallbackName)
      }),

      initContainers: mapInputs(initContainers, (container, index, all) => {
        const fallbackName = all.length === 1 ? `init-${options.name}` : `init-${options.name}-${index}`

        return mapContainer(container, fallbackName)
      }),

      volumes: mapInputs(
        // Add all volumes from the workload and its containers
        // Conflict resolution is not supported, validation errors are possible
        mergeInputArrays<WorkloadVolume>(
          normalizeInputs(options.volume, options.volumes),
          flattenInputs(mapInputs(containers, contaner => normalizeInputs(contaner.volume, contaner.volumes))),
          flattenInputs(mapInputs(initContainers, contaner => normalizeInputs(contaner.volume, contaner.volumes))),
        ),
        mapWorkloadVolume,
      ),

      activeDeadlineSeconds: options.activeDeadlineSeconds,
      affinity: options.affinity,
      automountServiceAccountToken: options.automountServiceAccountToken,
      dnsConfig: options.dnsConfig,
      dnsPolicy: options.dnsPolicy,
      enableServiceLinks: options.enableServiceLinks,
      ephemeralContainers: options.ephemeralContainers,
      hostAliases: options.hostAliases,
      hostIPC: options.hostIPC,
      hostname: options.hostname,
      hostNetwork: options.hostNetwork,
      hostPID: options.hostPID,
      hostUsers: options.hostUsers,
      imagePullSecrets: options.imagePullSecrets,
      nodeName: options.nodeName,
      nodeSelector: options.nodeSelector,
      os: options.os,
      overhead: options.overhead,
      preemptionPolicy: options.preemptionPolicy,
      priority: options.priority,
      priorityClassName: options.priorityClassName,
      readinessGates: options.readinessGates,
      resourceClaims: options.resourceClaims,
      restartPolicy: options.restartPolicy ?? defaultRestartPolicy,
      runtimeClassName: options.runtimeClassName,
      schedulerName: options.schedulerName,
      schedulingGates: options.schedulingGates,
      securityContext: options.securityContext,
      serviceAccountName: options.serviceAccountName,
      setHostnameAsFQDN: options.setHostnameAsFQDN,
      shareProcessNamespace: options.shareProcessNamespace,
      subdomain: options.subdomain,
      terminationGracePeriodSeconds: options.terminationGracePeriodSeconds,
      tolerations: options.tolerations,
      topologySpreadConstraints: options.topologySpreadConstraints,
    },
  }
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

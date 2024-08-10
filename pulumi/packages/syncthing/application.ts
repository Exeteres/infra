import { InputArray, pulumi } from "@infra/core"
import { gw } from "../gateway"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.GatewayApplicationOptions {
  volumeClaims?: {
    /**
     * The options for volume claim for the application state.
     */
    state?: Partial<k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>>

    /**
     * The options for volume claims for the application data.
     */
    dataClaims?: Omit<k8s.PersistentVolumeClaimOptions, "namespace">[]
  }

  /**
   * The instance name.
   */
  instanceName?: pulumi.Input<string>

  /**
   * The options to configure the service.
   */
  service?: k8s.ChildComponentOptions<k8s.ServiceOptions>

  /**
   * The options for the state backup.
   * If not specified, backups will be disabled.
   */
  stateBackup?: restic.BackupOptions

  /**
   * The sidecar containers to add to the application.
   */
  sidecarContainers?: k8s.ContainerOptions[]

  /**
   * The service account to use for the application.
   */
  serviceAccount?: k8s.raw.core.v1.ServiceAccount
}

export interface Application extends k8s.Application, gw.GatewayApplication {
  /**
   * The workload service that powers the application.
   */
  workloadService: k8s.WorkloadService<"StatefulSet">

  volumeClaims: {
    /**
     * The volume claim for the application state.
     */
    state: k8s.raw.core.v1.PersistentVolumeClaim

    /**
     * The volume claims for the application data.
     */
    dataClaims: k8s.raw.core.v1.PersistentVolumeClaim[]
  }
}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The application.
 */
export function createApplication(options: ApplicationOptions = {}): Application {
  const name = options.name ?? "syncthing"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const stateVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("state", fullName),
    namespace,

    realName: "state",

    ...options.volumeClaims?.state,

    capacity: "100Mi",
  })

  const dataVolumeClaims = (options.volumeClaims?.dataClaims ?? []).map(dataClaim => {
    return k8s.createPersistentVolumeClaim({
      ...dataClaim,

      name: k8s.getPrefixedName(dataClaim.name, fullName),
      namespace,

      realName: dataClaim.name,

      capacity: dataClaim.capacity ?? "1Gi",
    })
  })

  const initContainers: pulumi.Input<k8s.raw.types.input.core.v1.Container[]> = []
  const sidecarContainers: k8s.ContainerOptions[] = []
  const extraVolumes: pulumi.Input<k8s.raw.types.input.core.v1.Volume[]> = []

  if (options.sidecarContainers) {
    sidecarContainers.push(...options.sidecarContainers)
  }

  if (options.stateBackup) {
    const bundle = restic.createScriptBundle({
      name: k8s.getPrefixedName("backup", fullName),
      namespace,

      repository: options.stateBackup.repository,
    })

    restic.createBackupCronJob({
      name: k8s.getPrefixedName("state", fullName),
      namespace,

      options: options.stateBackup,
      bundle,
      volumeClaim: stateVolumeClaim,
    })

    const { volumes, initContainer, sidecarContainer } = restic.createExtraContainers({
      name: k8s.getPrefixedName("state", fullName),
      namespace,

      options: options.stateBackup,
      bundle,
      volume: stateVolumeClaim.metadata.name,
    })

    initContainers.push(initContainer)
    sidecarContainers.push(sidecarContainer)
    extraVolumes.push(...volumes)
  }

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "StatefulSet",
    realName: "syncthing",
    serviceAccountName: options.serviceAccount?.metadata.name,

    container: {
      image: "linuxserver/syncthing:1.27.8",
      name: options.instanceName ?? "syncthing",

      environment: {
        PUID: "1000",
        PGID: "1000",
        TZ: "Etc/UTC",
      },

      volumeMounts: [
        {
          name: stateVolumeClaim.metadata.name,
          mountPath: "/config",
        },
        ...dataVolumeClaims.map(dataClaim => ({
          name: dataClaim.metadata.name,
          mountPath: pulumi.interpolate`/data/${dataClaim.metadata.name}`,
        })),
      ],
    },

    service: options.service,
    initContainers,
    containers: sidecarContainers,
    nodeSelector: options.nodeSelector,

    ports: [
      { name: "http", port: 8384, protocol: "TCP" },
      { name: "sync-tcp", port: 22000, protocol: "TCP" },
      { name: "sync-udp", port: 22000, protocol: "UDP" },
      { name: "discovery", port: 21027, protocol: "UDP" },
    ],

    volumes: [stateVolumeClaim, ...dataVolumeClaims, ...extraVolumes],
  })

  const gateway = gw.createApplicationGateway(options.gateway, {
    name: fullName,
    namespace,

    httpRoute: {
      name: fullName,
      rule: {
        backendRef: {
          name: workloadService.service.metadata.name,
          port: 8384,
        },
      },
    },
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    workloadService,

    volumeClaims: {
      state: stateVolumeClaim,
      dataClaims: dataVolumeClaims,
    },

    gateway,
  }
}

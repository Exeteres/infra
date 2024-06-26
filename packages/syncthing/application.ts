import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"

export interface ApplicationOptions extends k8s.ApplicationOptions {
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
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>

  /**
   * The options for the state backup.
   * If not specified, backups will be disabled.
   */
  stateBackup?: restic.BackupOptions
}

export interface Application extends k8s.Application {
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

  /**
   * The ingress which exposes the application.
   */
  ingress?: k8s.raw.networking.v1.Ingress
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
  const sidecarContainers: pulumi.Input<k8s.raw.types.input.core.v1.Container[]> = []
  const extraVolumes: pulumi.Input<k8s.raw.types.input.core.v1.Volume[]> = []

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

  const ingress =
    options.ingress &&
    k8s.createIngress({
      name: fullName,
      namespace,

      ...options.ingress,

      rules: [
        {
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: workloadService.service.metadata.name,
                    port: { name: "http" },
                  },
                },
              },
            ],
          },
        },
      ],
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

    ingress,
  }
}

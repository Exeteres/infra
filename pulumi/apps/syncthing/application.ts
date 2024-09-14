import { pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.RoutesApplicationOptions {
  state: {
    /**
     * The options for the application state.
     */
    volumeClaim?: Partial<k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>>

    /**
     * The options for the state backup.
     * If not specified, backups will be disabled.
     */
    backup: restic.BackupOptions
  }

  data?: {
    /**
     * The options for the application data.
     */
    volumeClaim?: Partial<k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>>
  }

  /**
   * The sidecar containers to add to the application.
   */
  sidecarContainers?: k8s.Container[]

  /**
   * The service account to use for the application.
   */
  serviceAccount?: k8s.raw.core.v1.ServiceAccount
}

export interface Application extends k8s.Application, gw.RoutesApplication {
  /**
   * The workload service that powers the application.
   */
  workloadService: k8s.WorkloadService<"StatefulSet">

  state: {
    /**
     * The volume claim for the application state.
     */
    volumeClaim: k8s.raw.core.v1.PersistentVolumeClaim
  }

  data: {
    /**
     * The volume claim for the application data.
     */
    volumeClaim: k8s.raw.core.v1.PersistentVolumeClaim
  }
}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The application.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = "syncthing"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const stateVolumeClaim = k8s.createPersistentVolumeClaim({
    name: "state",
    namespace,
    capacity: "100Mi",

    ...options.state?.volumeClaim,
  })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: "data",
    namespace,
    capacity: "1Gi",

    ...options.data?.volumeClaim,
  })

  const bundle = scripting.createBundle({
    name: "backup",
    namespace,

    environment: options.state.backup.environment,
  })

  const { restoreJob } = restic.createJobPair({
    namespace,
    options: options.state.backup,
    bundle,
    volumeClaim: stateVolumeClaim,
    backupOptions: ["--exclude=index-*.db"],
  })

  const workloadService = k8s.createWorkloadService({
    name,
    namespace,

    kind: "StatefulSet",
    serviceAccountName: options.serviceAccount?.metadata.name,
    serviceName: name,
    dependsOn: restoreJob,

    container: {
      image: "linuxserver/syncthing:1.27.12",

      environment: {
        PUID: "1000",
        PGID: "1000",
        TZ: "Etc/UTC",
      },

      volumeMounts: [
        {
          volume: stateVolumeClaim,
          mountPath: "/config",
        },
        {
          volume: dataVolumeClaim,
          mountPath: "/data",
        },
      ],
    },

    containers: options.sidecarContainers,

    ports: [
      { name: "http", port: 8384, protocol: "TCP" },
      { name: "sync-tcp", port: 22000, protocol: "TCP" },
      { name: "sync-udp", port: 22000, protocol: "UDP" },
      { name: "discovery", port: 21027, protocol: "UDP" },
    ],

    volumes: [stateVolumeClaim, dataVolumeClaim] as any,
  })

  const routes = gw.createApplicationRoutes(namespace, options.routes, {
    httpRoute: {
      name,
      rule: {
        backend: {
          service: workloadService.service,
          port: 8384,
        },
      },
    },
  })

  return {
    namespace,
    workloadService,
    routes,

    state: {
      volumeClaim: stateVolumeClaim,
    },

    data: {
      volumeClaim: dataVolumeClaim,
    },
  }
}

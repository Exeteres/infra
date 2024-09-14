import { output } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.RoutesApplicationOptions {
  data: {
    /**
     * The options for the application data.
     */
    volumeClaim?: Partial<k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>>

    /**
     * The options for the data backup.
     */
    backup: restic.BackupOptions
  }
}

export interface Application extends k8s.Application, gw.RoutesApplication {
  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"Deployment">

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
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = "sftpgo"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: "data",
    namespace,
    capacity: "1Gi",

    ...options.data.volumeClaim,
  })

  const configMap = k8s.createConfigMap({
    name: "config",
    namespace,

    key: "sftpgo.json",
    value: output({
      webdavd: {
        bindings: [
          {
            port: 8081,
            prefix: "/webdav",
          },
        ],
      },
    }).apply(JSON.stringify),
  })

  const backupBundle = scripting.createBundle({
    name: "backup",
    namespace,

    environment: options.data.backup.environment,
  })

  const { restoreJob } = restic.createJobPair({
    namespace,
    options: options.data.backup,
    bundle: backupBundle,
    volumeClaim: dataVolumeClaim,
  })

  const workloadService = k8s.createWorkloadService({
    name,
    namespace,
    dependsOn: restoreJob,

    kind: "Deployment",

    ports: [
      {
        name: "web",
        port: 8080,
      },
      {
        name: "webdav",
        port: 8081,
      },
    ],

    container: {
      image: "drakkan/sftpgo:v2.6.2-alpine",
      args: ["sftpgo", "serve", "--config-file", "/etc/sftpgo/sftpgo.json"],

      volumeMounts: [
        {
          volume: dataVolumeClaim,
          subPath: "data",
          mountPath: "/srv/sftpgo",
        },
        {
          volume: dataVolumeClaim,
          subPath: "home",
          mountPath: "/var/lib/sftpgo",
        },
        {
          volume: configMap,
          mountPath: "/etc/sftpgo",
        },
      ],
    },

    // TODO: fix typings
    volumes: [dataVolumeClaim, configMap] as any,
  })

  const routes = gw.createApplicationRoutes(namespace, options.routes, {
    httpRoutes: [
      {
        name,
        rule: {
          backend: {
            service: workloadService.service,
            port: 8080,
          },
        },
      },
      {
        name: "webdav",
        rule: {
          backend: {
            service: workloadService.service,
            port: 8081,
          },
          match: "/webdav",
        },
      },
    ],
  })

  return {
    namespace,
    data: {
      volumeClaim: dataVolumeClaim,
    },
    workloadService,
    routes,
  }
}

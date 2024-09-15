import { Input, pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.RoutesApplicationOptions {
  /**
   * The fully qualified domain name which is available to the internet.
   */
  publicDomain: Input<string>

  /**
   * The database credentials.
   */
  databaseCredentials: postgresql.DatabaseCredentials

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

  /**
   * The options for the public routes which are exposed to the internet.
   */
  publicRoutes?: gw.RoutesOptions
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

  /**
   * The public routes created for the application.
   */
  publicRoutes?: gw.RouteBundle
}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = "n8n"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: "data",
    namespace,
    capacity: "1Gi",

    ...options.data.volumeClaim,
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

    port: 5678,
    volume: dataVolumeClaim,

    container: {
      image: "docker.n8n.io/n8nio/n8n",

      environment: {
        WEBHOOK_URL: pulumi.interpolate`https://${options.publicDomain}/`,

        DB_TYPE: "postgresdb",
        DB_POSTGRESDB_DATABASE: {
          secret: options.databaseCredentials.secret,
          key: "database",
        },
        DB_POSTGRESDB_HOST: {
          secret: options.databaseCredentials.secret,
          key: "host",
        },
        DB_POSTGRESDB_PORT: {
          secret: options.databaseCredentials.secret,
          key: "port",
        },
        DB_POSTGRESDB_USER: {
          secret: options.databaseCredentials.secret,
          key: "username",
        },
        DB_POSTGRESDB_PASSWORD: {
          secret: options.databaseCredentials.secret,
          key: "password",
        },

        N8N_DIAGNOSTICS_ENABLED: "false",
        N8N_VERSION_NOTIFICATIONS_ENABLED: "false",
        N8N_TEMPLATES_ENABLED: "false",
      },

      volumeMount: {
        volume: dataVolumeClaim,
        mountPath: "/home/node/.n8n",
      },
    },
  })

  const routes = gw.createApplicationRoutes(namespace, options.routes, {
    httpRoute: {
      name,
      rule: {
        backend: workloadService.service,
      },
    },
  })

  const publicRoutes = gw.createApplicationRoutes(namespace, options.publicRoutes, {
    httpRoute: {
      name: "public",
      rule: {
        backend: workloadService.service,
        matches: ["/webhook", "/webhook-test", "/form", "/form-test"],
      },
    },
  })

  return {
    namespace,
    workloadService,
    routes,
    publicRoutes,
    data: {
      volumeClaim: dataVolumeClaim,
    },
  }
}

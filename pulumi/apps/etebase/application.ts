import { pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.RoutesApplicationOptions {
  /**
   * The fully qualified domain name.
   */
  domain: pulumi.Input<string>

  /**
   * The database credentials.
   */
  databaseCredentials: postgresql.DatabaseCredentials

  /**
   * The options for the backup.
   */
  backup: restic.BackupOptions
}

export interface Application extends k8s.Application, gw.RoutesApplication {
  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"Deployment">
}

export function createApplication(options: ApplicationOptions): Application {
  const name = "etebase"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: "data",
    namespace,

    capacity: "1Gi",
  })

  const bundle = scripting.createBundle({
    name: "backup",
    namespace,

    environment: options.backup.environment,
  })

  const { restoreJob } = restic.createJobPair({
    namespace,
    bundle,
    options: options.backup,
    volumeClaim: dataVolumeClaim,
  })

  const workloadService = k8s.createWorkloadService({
    name,
    namespace,

    kind: "Deployment",
    dependsOn: restoreJob,

    port: 3735,

    container: {
      image: "victorrds/etesync:0.14-alpine",

      volumeMounts: [
        {
          name: dataVolumeClaim.metadata.name,
          mountPath: "/data",
        },
      ],

      environment: {
        DB_ENGINE: "postgres",
        DATABASE_NAME: {
          secret: options.databaseCredentials.secret,
          key: "database",
        },
        DATABASE_USER: {
          secret: options.databaseCredentials.secret,
          key: "username",
        },
        DATABASE_PASSWORD: {
          secret: options.databaseCredentials.secret,
          key: "password",
        },
        DATABASE_HOST: {
          secret: options.databaseCredentials.secret,
          key: "host",
        },
        DATABASE_PORT: {
          secret: options.databaseCredentials.secret,
          key: "port",
        },

        ALLOWED_HOSTS: options.domain,
      },
    },

    volume: dataVolumeClaim,
  })

  const routes = gw.createApplicationRoutes(namespace, options.routes, {
    httpRoute: {
      name: "etebase",
      rule: {
        backend: workloadService.service,
      },
    },
  })

  return {
    namespace,
    workloadService,
    routes,
  }
}

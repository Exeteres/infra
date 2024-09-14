import { merge, pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"
import { createScriptingEnvironment } from "./scripting"
import { scripting } from "@infra/scripting"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The options for the backup.
   */
  backup: restic.BackupOptions

  /**
   * The password for the postgres user.
   */
  rootPassword: pulumi.Input<string>
}

export interface Application extends k8s.ReleaseApplication {
  /**
   * The secret containing the root password.
   */
  rootPasswordSecret: k8s.raw.core.v1.Secret

  /**
   * The data volume claim.
   */
  dataVolumeClaim: k8s.raw.core.v1.PersistentVolumeClaim

  /**
   * The service of the PostgreSQL database.
   */
  service: pulumi.Output<k8s.raw.core.v1.Service>

  /**
   * The hostname of the PostgreSQL database in the Kubernetes cluster.
   * For example, `postgresql.postgresql.svc`.
   */
  host: string
}

/**
 * Creates a PostgreSQL database using the Bitnami Helm chart.
 *
 * @param options The options for the PostgreSQL database.
 * @returns The PostgreSQL database release and certificate.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = "postgresql"
  const host = "postgresql.postgresql.svc"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const rootPasswordSecret = k8s.createSecret({
    name: "root-password",
    namespace,

    realName: "root-password",

    key: "postgres-password",
    value: options.rootPassword,
  })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: "data",
    namespace,

    capacity: "1Gi",
  })

  const bundle = scripting.createBundle({
    name: "backup",
    namespace,

    environment: createScriptingEnvironment({
      rootPasswordSecret,
      environment: scripting.mergeEnvironments(options.backup.environment, {
        environment: {
          DATABASE_HOST: host,
        },
      }),
    }),
  })

  restic.createBackupJob({
    name: "backup",
    namespace,
    bundle,
    options: options.backup,
  })

  const restoreJob = restic.createRestoreJob({
    name: "restore",
    namespace,
    bundle,
    options: options.backup,
    volumeClaim: dataVolumeClaim,
    subPath: "data",
  })

  const release = k8s.createHelmRelease({
    name,
    namespace,
    dependsOn: restoreJob,

    repo: "https://charts.bitnami.com/bitnami",
    chart: "postgresql",
    version: "15.5.31",

    ...options.release,

    values: merge(
      {
        fullnameOverride: name,

        volumePermissions: {
          enabled: true,
        },

        primary: {
          persistence: {
            existingClaim: dataVolumeClaim.metadata.name,
          },

          pgHbaConfiguration: [
            //
            "host all         all 0.0.0.0/0 scram-sha-256",
            "host replication all 0.0.0.0/0 scram-sha-256",
          ].join("\n"),
        },

        auth: {
          existingSecret: rootPasswordSecret.metadata.name,
        },
      },
      options.release?.values ?? {},
    ),
  })

  return {
    namespace,
    release,

    rootPasswordSecret,
    dataVolumeClaim,

    host,
    service: release.status.name.apply(releaseName => {
      return k8s.raw.core.v1.Service.get(releaseName, `${releaseName}/postgresql`, { parent: namespace })
    }),
  }
}

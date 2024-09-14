import { merge, pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"
import { createScriptingEnvironment } from "./scripting"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The options for the backup.
   */
  backup: restic.BackupOptions

  /**
   * The root password for the MariaDB database.
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
   * The service of the MariaDB database.
   */
  service: pulumi.Output<k8s.raw.core.v1.Service>

  /**
   * The hostname of the MariaDB database in the Kubernetes cluster.
   * For example, `mariadb.mariadb.svc`.
   */
  host: pulumi.Output<string>
}

export function createApplication(options: ApplicationOptions): Application {
  const name = "mariadb"
  const host = "mariadb.mariadb.svc"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const rootPasswordSecret = k8s.createSecret({
    name: "root-password",
    namespace,

    key: "mariadb-root-password",
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

        volumes: [dataVolumeClaim],
      }),
    }),
  })

  restic.createBackupJob({
    name: "backup",
    namespace,
    bundle,
    options: options.backup,

    container: {
      image: "alpine:edge",
      volumeMount: {
        volume: dataVolumeClaim,
        mountPath: "/bitnami/mariadb",
      },
    },
  })

  const restoreJob = restic.createRestoreJob({
    name: "restore",
    namespace,
    bundle,
    options: options.backup,

    container: {
      image: "alpine:edge",
      volumeMount: {
        volume: dataVolumeClaim,
        mountPath: "/data",
        subPath: "data",
      },
    },
  })

  const release = k8s.createHelmRelease({
    name,
    namespace,
    dependsOn: restoreJob,

    repo: "https://charts.bitnami.com/bitnami",
    chart: "mariadb",
    version: "19.0.5",

    ...options.release,

    values: merge(
      {
        auth: {
          database: "",
          existingSecret: rootPasswordSecret.metadata.name,
        },
        primary: {
          persistence: {
            existingClaim: dataVolumeClaim.metadata.name,
          },
        },
      },
      options.release?.values ?? {},
    ),
  })

  return {
    namespace,

    rootPasswordSecret,
    release,
    dataVolumeClaim,

    host: pulumi.interpolate`${release.status.name}.mariadb.svc`,
    service: release.status.name.apply(releaseName => {
      return k8s.raw.core.v1.Service.get(releaseName, `${releaseName}/mariadb`, { parent: namespace })
    }),
  }
}

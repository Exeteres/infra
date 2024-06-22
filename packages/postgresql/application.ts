import { merge, pulumi, random, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"
import { scriptEnvironment } from "./scripting"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The options for the backup.
   * If not specified, backups will be disabled.
   */
  backup?: restic.BackupOptions

  /**
   * The password for the postgres user.
   * If not specified, a random password will be generated.
   */
  rootPassword?: pulumi.Input<string>
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
}

/**
 * Creates a PostgreSQL database using the Bitnami Helm chart.
 *
 * @param options The options for the PostgreSQL database.
 * @returns The PostgreSQL database release and certificate.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "postgresql"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const rootPasswordSecret = k8s.createSecret({
    name: k8s.getPrefixedName("root-password", fullName),
    namespace,

    realName: "root-password",

    key: "postgres-password",
    value:
      options.rootPassword ??
      random.createPassword({
        name: k8s.getPrefixedName("root-password", fullName),
        parent: namespace,
        length: 16,
      }).result,
  })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("data", fullName),
    namespace,

    capacity: "1Gi",
  })

  const initContainers: k8s.raw.types.input.core.v1.Container[] = []
  const sidecarContainers: k8s.raw.types.input.core.v1.Container[] = []
  const extraVolumes: k8s.raw.types.input.core.v1.Volume[] = []

  if (options.backup) {
    const bundle = restic.createScriptBundle({
      name: k8s.getPrefixedName("backup", fullName),
      namespace,

      repository: options.backup.repository,

      environment: scripting.mergeEnvironments(scriptEnvironment, {
        distro: "alpine",

        scripts: {
          "lock.sh": trimIndentation(`
            #!/bin/sh
            set -e
        
            echo "| Locking tables..."
            psql -h postgres -U postgres -c "SELECT pg_start_backup('label', true);"
            echo "| Tables locked"
          `),

          "unlock.sh": trimIndentation(`
            #!/bin/sh
            set -e
        
            echo "| Unlocking tables..."
            psql -h postgres -U postgres -c "SELECT pg_stop_backup();"
            echo "| Tables unlocked"
          `),
        },

        environment: {
          PGPASSWORD: {
            secretKeyRef: {
              name: rootPasswordSecret.metadata.name,
              key: "postgres-password",
            },
          },
        },
      }),
    })

    restic.createBackupCronJob({
      name: fullName,
      namespace,

      options: options.backup,
      bundle,
      volumeClaim: dataVolumeClaim,
    })

    const { volumes, initContainer, sidecarContainer } = restic.createExtraContainers({
      name: fullName,
      namespace,

      options: options.backup,
      bundle,
      volume: "data",
    })

    initContainers.push(initContainer)
    sidecarContainers.push(sidecarContainer)
    extraVolumes.push(...volumes)
  }

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    repo: "https://charts.bitnami.com/bitnami",
    chart: "postgresql",
    version: "15.4.0",

    ...options.releaseOptions,

    values: merge(
      {
        fullnameOverride: name,

        volumePermissions: {
          enabled: true,
        },

        primary: {
          nodeSelector: options.nodeSelector,

          persistence: {
            existingClaim: dataVolumeClaim.metadata.name,
          },

          initContainers,
          sidecars: sidecarContainers,
          extraVolumes,

          pgHbaConfiguration: [
            //
            "host all all 0.0.0.0/0 scram-sha-256",
          ].join("\n"),
        },

        auth: {
          existingSecret: rootPasswordSecret.metadata.name,
        },
      },
      options.releaseOptions?.values ?? {},
    ),
  })

  return {
    name,
    fullName,
    prefix: options.prefix,
    namespace,
    release,

    rootPasswordSecret,
    dataVolumeClaim,
  }
}

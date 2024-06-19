import { merge, pulumi, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The options for the backup.
   * If not specified, backups will be disabled.
   */
  backup?: restic.BackupOptions
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

export function createApplication(options: ApplicationOptions = {}): Application {
  const name = options.name ?? "mariadb"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const rootPasswordSecret = k8s.createPasswordSecret({
    name: k8s.getPrefixedName("root-password", fullName),
    namespace,

    realName: "root-password",

    key: "mariadb-root-password",
    length: 16,
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

      environment: {
        distro: "alpine",
        packages: ["mariadb-client"],

        setupScripts: {
          "configure-mysql-client.sh": trimIndentation(`
            #!/bin/sh
            set -e

            cat > /root/.my.cnf <<EOF
            [client]
            user=root
            password="$MARIADB_ROOT_PASSWORD"
            EOF
          `),
        },

        scripts: {
          "lock.sh": trimIndentation(`
            #!/bin/sh
            set -e

            echo "| Locking tables..."
            mysql -h mariadb -u root -e "FLUSH TABLES WITH READ LOCK;"
            echo "| Tables locked"
          `),

          "unlock.sh": trimIndentation(`
            #!/bin/sh
            set -e

            echo "| Unlocking tables..."
            mysql -h mariadb -u root -e "UNLOCK TABLES;"
            echo "| Tables unlocked"
          `),
        },

        environment: {
          MARIADB_ROOT_PASSWORD: {
            secretKeyRef: {
              name: rootPasswordSecret.metadata.name,
              key: "mariadb-root-password",
            },
          },
        },
      },
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
    chart: "mariadb",
    version: "18.2.2",

    ...options.releaseOptions,

    values: merge(
      {
        auth: {
          database: "",
          existingSecret: rootPasswordSecret.metadata.name,
        },
        primary: {
          nodeSelector: options.nodeSelector,
          persistence: {
            existingClaim: dataVolumeClaim.metadata.name,
          },
          initContainers,
          sidecars: sidecarContainers,
          extraVolumes,
        },
      },
      options.releaseOptions?.values ?? {},
    ),
  })

  return {
    name,
    fullName,
    namespace,
    prefix: options.prefix,

    rootPasswordSecret,
    release,
    dataVolumeClaim,
  }
}

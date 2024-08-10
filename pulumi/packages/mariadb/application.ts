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
   * The root password for the MariaDB database.
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

export function createApplication(options: ApplicationOptions = {}): Application {
  const name = options.name ?? "mariadb"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const rootPasswordSecret = k8s.createSecret({
    name: k8s.getPrefixedName("root-password", fullName),
    namespace,

    realName: "root-password",

    key: "mariadb-root-password",
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
    chart: "mariadb",
    version: "19.0.1",

    ...options.release,

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
      options.release?.values ?? {},
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

    host: pulumi.interpolate`${release.status.name}.mariadb.svc`,
    service: release.status.name.apply(releaseName => {
      return k8s.raw.core.v1.Service.get(releaseName, `${releaseName}/mariadb`, { parent: namespace })
    }),
  }
}

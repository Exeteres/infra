import { pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { restic } from "@infra/restic"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.GatewayApplicationOptions {
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
   * If not specified, backups will be disabled.
   */
  backup?: restic.BackupOptions
}

export interface Application extends k8s.Application, gw.GatewayApplication {
  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"Deployment">
}

export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "etebase"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("data", fullName),
    namespace,

    realName: "data",

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

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "Deployment",

    annotations: options.annotations,
    labels: options.labels,

    nodeSelector: options.nodeSelector,

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
        DATABASE_NAME: options.databaseCredentials.database,
        DATABASE_USER: options.databaseCredentials.username,
        DATABASE_PASSWORD: options.databaseCredentials.password,
        DATABASE_HOST: options.databaseCredentials.host,
        DATABASE_PORT: options.databaseCredentials.port,

        ALLOWED_HOSTS: options.domain,
      },
    },

    initContainers,
    containers: sidecarContainers,

    volume: dataVolumeClaim,
    volumes: extraVolumes,
  })

  const gateway = gw.createApplicationGateway(options.gateway, {
    name: fullName,
    namespace,

    httpRoute: {
      name: fullName,
      rule: {
        backendRef: {
          name: workloadService.service.metadata.name,
          port: workloadService.service.spec.ports[0].port,
        },
      },
    },
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    workloadService,
    gateway,
  }
}

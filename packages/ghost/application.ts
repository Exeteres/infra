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
  const name = options.name ?? "ghost"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const contentVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("content", fullName),
    namespace,

    realName: "content",

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
      volumeClaim: contentVolumeClaim,
    })

    const { volumes, initContainer, sidecarContainer } = restic.createExtraContainers({
      name: fullName,
      namespace,

      options: options.backup,
      bundle,
      volume: "content",
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

    port: 2368,

    container: {
      image: "ghost:5.87.3-alpine",

      environment: {
        url: pulumi.interpolate`https://${options.domain}`,
        database__client: "mysql",
        database__connection__host: {
          secretKeyRef: {
            name: options.databaseCredentials.secret.metadata.name,
            key: "host",
          },
        },
        database__connection__user: {
          secretKeyRef: {
            name: options.databaseCredentials.secret.metadata.name,
            key: "username",
          },
        },
        database__connection__password: {
          secretKeyRef: {
            name: options.databaseCredentials.secret.metadata.name,
            key: "password",
          },
        },
        database__connection__database: {
          secretKeyRef: {
            name: options.databaseCredentials.secret.metadata.name,
            key: "database",
          },
        },
      },

      volumeMounts: [
        {
          name: contentVolumeClaim.metadata.name,
          mountPath: "/var/lib/ghost/content",
        },
      ],
    },

    containers: sidecarContainers,
    initContainers,

    volume: contentVolumeClaim,
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

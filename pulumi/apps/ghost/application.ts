import { pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"

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
   */
  backup: restic.BackupOptions

  /**
   * The SMTP credentials.
   */
  smtpCredentials: SMTPCredentials
}

export interface Application extends gw.GatewayApplication {
  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"Deployment">
}

export interface SMTPCredentials {
  /**
   * The SMTP host.
   */
  host: pulumi.Input<string>

  /**
   * The SMTP port.
   */
  port: pulumi.Input<number>

  /**
   * The SMTP username.
   */
  username: pulumi.Input<string>

  /**
   * The SMTP password.
   */
  password: pulumi.Input<string>

  /**
   * The from email address.
   */
  from: pulumi.Input<string>
}

export function createApplication(options: ApplicationOptions): Application {
  const name = "ghost"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const contentVolumeClaim = k8s.createPersistentVolumeClaim({
    name: "content",
    namespace,

    capacity: "1Gi",
  })

  // const smtpCredentialsSecret = k8s.createSecret({
  //   name: "smtp-credentials",
  //   namespace,

  //   data: {
  //     host: options.smtpCredentials.host,
  //     port: options.smtpCredentials.port.toString(),
  //     username: options.smtpCredentials.username,
  //     password: options.smtpCredentials.password,
  //     from: options.smtpCredentials.from,
  //   },
  // })

  const bundle = scripting.createBundle({
    name: "backup",
    namespace,

    environment: options.backup.environment,
  })

  const { restoreJob } = restic.createJobPair({
    namespace,
    bundle,
    options: options.backup,
    volumeClaim: contentVolumeClaim,
  })

  const workloadService = k8s.createWorkloadService({
    name,
    namespace,

    kind: "Deployment",
    dependsOn: restoreJob,

    port: 2368,

    container: {
      image: "ghost:5.87.3-alpine",

      environment: {
        url: pulumi.interpolate`https://${options.domain}/${options.gateway!.pathPrefix}`, // TODO fix

        database__client: "mysql",
        database__connection__host: {
          secret: options.databaseCredentials.secret,
          key: "host",
        },
        database__connection__user: {
          secret: options.databaseCredentials.secret,
          key: "username",
        },
        database__connection__password: {
          secret: options.databaseCredentials.secret,
          key: "password",
        },
        database__connection__database: {
          secret: options.databaseCredentials.secret,
          key: "database",
        },
      },

      resources: {
        limits: {
          cpu: "500m",
          memory: "512Mi",
        },
      },

      volumeMounts: [
        {
          name: contentVolumeClaim.metadata.name,
          mountPath: "/var/lib/ghost/content",
        },
      ],
    },

    volume: contentVolumeClaim,
  })

  const gateway = gw.createApplicationRoutes(namespace, options.gateway, {
    httpRoute: {
      name,
      rule: {
        backend: workloadService.service,
      },
    },
  })

  return {
    workloadService,
    gateway,
  }
}

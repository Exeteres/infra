import { output, pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { minio } from "@infra/minio"
import { postgresql } from "@infra/postgresql"
import { smtp } from "@infra/smtp"

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
   * The S3 credentials.
   */
  s3Credentials: minio.S3Credentials

  /**
   * The SMTP credentials.
   */
  smtp: smtp.Options

  /**
   * The key options.
   */
  key: {
    encryption: pulumi.Input<string>
    hash: pulumi.Input<string>
  }

  /**
   * The jwt options.
   */
  jwt: {
    secret: pulumi.Input<string>
  }
}

export interface Application extends k8s.Application, gw.RoutesApplication {
  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"Deployment">
}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = "ente"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const smtpCredentials = output(options.smtp.credentials)

  const secret = k8s.createSecret({
    name: "museum",
    namespace,

    key: "museum.yaml",
    value: output({
      db: {
        host: options.databaseCredentials.host,
        port: options.databaseCredentials.port,
        name: options.databaseCredentials.database,
        user: options.databaseCredentials.username,
        password: options.databaseCredentials.password,
      },
      s3: {
        are_local_buckets: true,
        "b2-eu-cen": {
          key: options.s3Credentials.accessKey,
          secret: options.s3Credentials.secretKey,
          endpoint: options.s3Credentials.endpoint,
          region: options.s3Credentials.region,
          bucket: options.s3Credentials.bucket,
        },
      },
      smtp: {
        host: smtpCredentials.host,
        port: smtpCredentials.port,
        username: smtpCredentials.username,
        password: smtpCredentials.password,
        email: options.smtp.from,
      },
      key: {
        encryption: options.key.encryption,
        hash: options.key.hash,
      },
      jwt: {
        secret: options.jwt.secret,
      },
    }).apply(JSON.stringify),
  })

  const workloadService = k8s.createWorkloadService({
    name,
    namespace,

    kind: "Deployment",

    port: 8080,
    volume: secret,

    container: {
      image: "ghcr.io/exeteres/infra/ente",

      volumeMount: {
        volume: secret,
        mountPath: "/museum.yaml",
        subPath: "museum.yaml",
      },
    },
  })

  const gateway = gw.createApplicationRoutes(namespace, options.routes, {
    httpRoute: {
      name,
      rule: {
        backend: workloadService.service,
      },
    },
  })

  return {
    namespace,
    workloadService,
    routes: gateway,
  }
}

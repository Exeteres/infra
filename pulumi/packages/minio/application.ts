import { merge, pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"
import { scripting } from "@infra/scripting"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions, gw.RoutesApplicationOptions {
  backup: restic.BackupOptions
  rootPassword: pulumi.Input<string>
  consoleGateway?: gw.RoutesOptions
}

export interface Application extends k8s.ReleaseApplication, gw.RoutesApplication {
  rootPasswordSecret: k8s.raw.core.v1.Secret
  dataVolumeClaim: k8s.raw.core.v1.PersistentVolumeClaim
  consoleGateway?: gw.RouteBundle
}

export interface S3Credentials {
  /**
   * The endpoint of the object storage.
   * For example, "https://minio.minio.svc".
   */
  endpoint: pulumi.Input<string>

  /**
   * The hostname of the object storage.
   * For example, "minio.minio.svc".
   */
  host: pulumi.Input<string>

  /**
   * The access key for the S3 bucket.
   */
  accessKey: pulumi.Input<string>

  /**
   * The secret key for the S3 bucket.
   */
  secretKey: pulumi.Input<string>

  /**
   * The region for the S3 bucket.
   */
  region: pulumi.Input<string>

  /**
   * The name of the S3 bucket.
   */
  bucket: pulumi.Input<string>
}

export function createApplication(options: ApplicationOptions): Application {
  const name = "minio"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const rootPasswordSecret = k8s.createSecret({
    name: "root-password",
    namespace,

    realName: "root-password",

    data: {
      username: "admin",
      password: options.rootPassword,
    },
  })

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

  const release = k8s.createHelmRelease({
    name,
    namespace,
    dependsOn: restoreJob,

    repo: "https://charts.bitnami.com/bitnami",
    chart: "minio",
    version: "14.6.21",

    ...options.release,

    values: merge(
      {
        auth: {
          existingSecret: rootPasswordSecret.metadata.name,
          rootUserSecretKey: "username",
          rootPasswordSecretKey: "password",
        },
        persistence: {
          existingClaim: dataVolumeClaim.metadata.name,
        },
      },
      options.release?.values ?? {},
    ),
  })

  const gateway = gw.createApplicationRoutes(namespace, options.routes, {
    httpRoute: {
      name,
      rule: {
        backend: {
          name: release.name,
          port: 9000,
        },
      },
    },
  })

  const consoleGateway = gw.createApplicationRoutes(namespace, options.consoleGateway, {
    httpRoute: {
      name: "console",
      rule: {
        backend: {
          name: release.name,
          port: 9001,
        },
      },
    },
  })

  return {
    namespace,

    rootPasswordSecret,
    release,
    dataVolumeClaim,

    routes: gateway,
    consoleGateway,
  }
}

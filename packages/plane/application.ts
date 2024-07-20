import { pulumi, random } from "@infra/core"
import { k8s } from "@infra/k8s"
import { gw } from "@infra/gateway"
import { postgresql } from "@infra/postgresql"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.GatewayApplicationOptions {
  /**
   * The database credentials.
   */
  databaseCredentials: postgresql.DatabaseCredentials

  /**
   * The secret containing the S3 configuration.
   * Must contain the:
   * - access_key
   * - secret_key
   * - region
   * - endpoint
   * - bucket
   */
  s3Secret: pulumi.Input<k8s.raw.core.v1.Secret>

  /**
   * The secret key to use for encrypting sensitive data.
   * If not provided, a random key will be generated.
   */
  secretKey?: pulumi.Input<string>
}

export interface Application extends k8s.ReleaseApplication, gw.GatewayApplication {}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "plane"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const s3Secret = pulumi.output(options.s3Secret)

  const secretKey =
    options.secretKey ??
    random.createRandomBytes({
      name: k8s.getPrefixedName("secret-key", fullName),
      parent: namespace,
      length: 32,
    }).hex

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    repo: "https://helm.plane.so",
    chart: "plane-ce",
    version: "1.0.20",

    values: {
      postgres: {
        local_setup: false,
      },

      minio: {
        local_setup: false,
      },

      ingress: {
        enabled: false,
      },

      redis: {
        storageClass: "local-path",
      },

      env: {
        pgdb_username: options.databaseCredentials.username,

        pgdb_password: options.databaseCredentials.password,
        pgdb_name: options.databaseCredentials.database,
        pgdb_remote_url: options.databaseCredentials.url,

        aws_access_key: s3Secret.stringData.access_key,
        aws_secret_access_key: s3Secret.stringData.secret_key,
        aws_region: s3Secret.stringData.region,
        aws_s3_endpoint_url: s3Secret.stringData.endpoint,
        docstore_bucket: s3Secret.stringData.bucket,

        secret_key: secretKey,
      },
    },
  })

  const gateway = gw.createApplicationGateway(options.gateway, {
    name: fullName,
    namespace,

    httpRoute: {
      name: fullName,
      rules: [
        {
          match: "/",
          backendRef: {
            name: pulumi.interpolate`${release.name}-web`,
            port: 3000,
          },
        },
        {
          match: "/spaces/",
          backendRef: {
            name: pulumi.interpolate`${release.name}-space`,
            port: 3000,
          },
        },
        {
          match: "/god-mode/",
          backendRef: {
            name: pulumi.interpolate`${release.name}-admin`,
            port: 3000,
          },
        },
        {
          match: "/api/",
          backendRef: {
            name: pulumi.interpolate`${release.name}-api`,
            port: 8000,
          },
        },
        {
          match: "/auth/",
          backendRef: {
            name: pulumi.interpolate`${release.name}-api`,
            port: 8000,
          },
        },
      ],
    },
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    release,
    gateway,
  }
}

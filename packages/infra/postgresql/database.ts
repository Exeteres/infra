import { pulumi, random } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface DatabaseOptions extends k8s.CommonOptions {
  /**
   * The service of the database.
   */
  service: pulumi.Input<k8s.raw.core.v1.Service>

  /**
   * The port of the database.
   * By default, it is set to 5432.
   */
  port?: pulumi.Input<string>

  /**
   * The name of the database.
   * If not provided, the name option will be used.
   */
  database?: pulumi.Input<string>

  /**
   * The username to use for the database.
   * If not provided, the database name will be used.
   */
  username?: pulumi.Input<string>

  /**
   * The password to use for the database.
   * If not provided, a random password will be generated.
   */
  password?: pulumi.Input<string>

  /**
   * The secret containing the password for the postgres user.
   * Must have a key named `postgres-password`.
   */
  rootPasswordSecret: k8s.raw.core.v1.Secret

  /**
   * The scripting bundle to use for the init container.
   */
  bundle: scripting.Bundle
}

export interface DatabaseCredentials {
  /**
   * The secret containing the database credentials.
   */
  secret: k8s.raw.core.v1.Secret

  /**
   * The service of the database.
   */
  service: pulumi.Output<k8s.raw.core.v1.Service>

  /**
   * The host of the database.
   */
  host: pulumi.Output<string>

  /**
   * The port of the database.
   */
  port: pulumi.Output<string>

  /**
   * The username to use for the database.
   */
  username: pulumi.Output<string>

  /**
   * The password to use for the database.
   */
  password: pulumi.Output<string>

  /**
   * The name of the database.
   */
  database: pulumi.Output<string>

  /**
   * The full URL to connect to the database.
   * For example, `postgresql://username:password@host:port/database`.
   */
  url: pulumi.Output<string>
}

export interface Database {
  /**
   * The job that will create the database and user.
   */
  setupJob: k8s.raw.batch.v1.Job

  /**
   * The database credentials.
   */
  credentials: DatabaseCredentials
}

/**
 * Creates all the resources needed to create a database:
 * - a secret containing the database credentials;
 * - an init container that will create the database and user;
 * - the extra volumes used by the init container.
 *
 * @param options The options for creating the database.
 * @returns The database resources.
 */
export function createDatabase(options: DatabaseOptions): Database {
  const databasePassword = options.password
    ? pulumi.output(options.password)
    : random.createPassword({
        name: `${options.name}-password`,
        parent: options.namespace,
        length: 16,
      }).result

  const service = pulumi.output(options.service)

  const host = pulumi.output(pulumi.interpolate`${service.metadata.name}.${service.metadata.namespace}.svc`)
  const port = pulumi.output(options.port ?? "5432")
  const database = pulumi.output(options.database ?? options.name)
  const username = pulumi.output(options.username ?? database)

  const credentials = {
    host,
    database,
    username,
    port,
    password: databasePassword,
    url: pulumi.interpolate`postgresql://${username}:${databasePassword}@${host}:${port}/${database}`,
  }

  const secret = k8s.createSecret({
    name: `${options.name}-postgres-credentials`,
    namespace: options.namespace,

    data: credentials,
  })

  const { container, volumes } = scripting.createContainerSpec({
    name: "init-database",
    namespace: options.namespace,

    bundle: options.bundle,
    main: "/scripts/init-database.sh",
  })

  const setupJob = k8s.createWorkload({
    name: `${options.name}-init-database`,
    namespace: options.namespace,

    kind: "Job",
    container: {
      ...container,

      env: [
        {
          name: "DATABASE_HOST",
          valueFrom: {
            secretKeyRef: {
              name: secret.metadata.name,
              key: "host",
            },
          },
        },
        {
          name: "DATABASE_NAME",
          valueFrom: {
            secretKeyRef: {
              name: secret.metadata.name,
              key: "database",
            },
          },
        },
        {
          name: "DATABASE_USER",
          valueFrom: {
            secretKeyRef: {
              name: secret.metadata.name,
              key: "username",
            },
          },
        },
        {
          name: "DATABASE_PASSWORD",
          valueFrom: {
            secretKeyRef: {
              name: secret.metadata.name,
              key: "password",
            },
          },
        },
        {
          name: "PGPASSWORD",
          valueFrom: {
            secretKeyRef: {
              name: options.rootPasswordSecret.metadata.name,
              key: "postgres-password",
            },
          },
        },
      ],
    },

    volumes,
  })

  return {
    setupJob,
    credentials: {
      secret,
      service,
      ...credentials,
    },
  }
}

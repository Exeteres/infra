import { pulumi } from "@infra/core"
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
   */
  password: pulumi.Input<string>

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
 * - a setup that will create the database and user.
 *
 * @param options The options for creating the database.
 * @returns The database resources.
 */
export function createDatabase(options: DatabaseOptions): Database {
  const databasePassword = pulumi.output(options.password)
  const normalizedName = pulumi.output(options.name).apply(name => name.replace(/-/g, "_"))

  const service = pulumi.output(options.service)

  const host = pulumi.output(pulumi.interpolate`${service.metadata.name}.${service.metadata.namespace}.svc`)
  const port = pulumi.output(options.port ?? "5432")
  const database = pulumi.output(options.database ?? normalizedName)
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
    name: `postgresql-credentials-${options.name}`,
    namespace: options.namespace,

    data: credentials,
  })

  const container = scripting.createContainer({
    name: "init-database",

    bundle: options.bundle,
    main: "init-database.sh",

    environment: {
      DATABASE_HOST: {
        secret,
        key: "host",
      },
      DATABASE_NAME: {
        secret,
        key: "database",
      },
      DATABASE_USER: {
        secret,
        key: "username",
      },
      DATABASE_PASSWORD: {
        secret,
        key: "password",
      },
    },
  })

  const setupJob = k8s.createJob({
    name: `init-database-${options.name}`,
    namespace: options.namespace,

    container,
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

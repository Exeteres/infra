import { pulumi, random } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface DatabaseOptions extends k8s.CommonOptions {
  /**
   * The host of the database.
   * For example, `mariadb`, `mariadb.default`, `mariadb.default.svc`, etc.
   */
  host: pulumi.Input<string>

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
   * The secret containing the root password.
   * Must have a key named `mariadb-root-password`.
   */
  rootPasswordSecret: k8s.raw.core.v1.Secret

  /**
   * The scripting bundle to use for the init container.
   */
  bundle: scripting.Bundle
}

export interface Database {
  /**
   * The secret containing the database credentials.
   */
  secret: k8s.raw.core.v1.Secret

  /**
   * The spec for the init container that will create the database and user.
   * Should be added to the pod spec of the container that will use the database.
   */
  initContainer: k8s.raw.types.input.core.v1.Container

  /**
   * The extra volumes used by the init container.
   * Should be added to the pod spec of the container that will use the database.
   */
  volumes: k8s.raw.types.input.core.v1.Volume[]
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
  const databasePassword =
    options.password ??
    random.createPassword({
      name: `${options.name}-password`,
      parent: options.namespace,
      length: 16,
    }).result

  const databaseSecret = k8s.createSecret({
    name: `${options.name}-mariadb-credentials`,
    namespace: options.namespace,

    data: {
      host: options.host,
      database: options.database ?? options.name,
      username: options.username ?? options.database ?? options.name,
      port: "3306",
      password: databasePassword,
      url: pulumi.interpolate`mysql://vaultwarden:${databasePassword}@mariadb.mariadb/vaultwarden`,
    },
  })

  const { container, volumes } = scripting.createContainerSpec({
    name: "init-database",
    namespace: options.namespace,

    bundle: options.bundle,
    main: "/scripts/init-database.sh",
  })

  return {
    initContainer: {
      ...container,

      env: [
        {
          name: "DATABASE_HOST",
          valueFrom: {
            secretKeyRef: {
              name: databaseSecret.metadata.name,
              key: "host",
            },
          },
        },
        {
          name: "DATABASE_NAME",
          valueFrom: {
            secretKeyRef: {
              name: databaseSecret.metadata.name,
              key: "database",
            },
          },
        },
        {
          name: "DATABASE_USER",
          valueFrom: {
            secretKeyRef: {
              name: databaseSecret.metadata.name,
              key: "username",
            },
          },
        },
        {
          name: "DATABASE_PASSWORD",
          valueFrom: {
            secretKeyRef: {
              name: databaseSecret.metadata.name,
              key: "password",
            },
          },
        },
        {
          name: "MARIADB_ROOT_PASSWORD",
          valueFrom: {
            secretKeyRef: {
              name: options.rootPasswordSecret.metadata.name,
              key: "mariadb-root-password",
            },
          },
        },
      ],
    },

    volumes: [
      ...volumes,
      {
        name: databaseSecret.metadata.name,
        secret: {
          secretName: databaseSecret.metadata.name,
        },
      },
    ],

    secret: databaseSecret,
  }
}

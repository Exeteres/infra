import { pulumi, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { scripting } from "@infra/scripting"
import { vaultwarden } from "@infra/vaultwarden"

const config = new pulumi.Config("vaultwarden")

const domain = config.require("domain")
const hostname = config.require("hostname")
const node = config.require("node")
const databasePassword = config.requireSecret("databasePassword")

const namespace = k8s.createNamespace({ name: "vaultwarden" })

const mariadbStack = new pulumi.StackReference("organization/mariadb/main")
const mariadbRootPassword = mariadbStack.getOutput("rootPassword")

const mariadbRootPasswordSecret = k8s.createSecret({
  name: "mariadb-root-password",
  namespace,

  key: "mariadb-root-password",
  value: mariadbRootPassword,
})

const databaseSecret = k8s.createSecret({
  name: "vaultwarden-database",
  namespace,

  data: {
    host: "mariadb.mariadb",
    database: "vaultwarden",
    username: "vaultwarden",
    password: databasePassword,
    url: pulumi.interpolate`mysql://vaultwarden:${databasePassword}@mariadb.mariadb/vaultwarden`,
  },
})

const mariadbEnvironment = mariadb.createScriptEnvironment({ rootPasswordSecret: mariadbRootPasswordSecret })

const { container, volumes } = scripting.createContainerSpec({
  name: "init-database",
  namespace,

  bundle: scripting.createBundle({
    name: "vaultwarden",
    namespace,

    environment: scripting.mergeEnvironments(mariadbEnvironment, {
      distro: "alpine",

      volumes: [
        {
          name: databaseSecret.metadata.name,
          secret: {
            secretName: databaseSecret.metadata.name,
          },
        },
      ],

      environment: {
        DATABASE_HOST: {
          secretKeyRef: {
            name: databaseSecret.metadata.name,
            key: "host",
          },
        },
        DATABASE_NAME: {
          secretKeyRef: {
            name: databaseSecret.metadata.name,
            key: "database",
          },
        },
        DATABASE_USER: {
          secretKeyRef: {
            name: databaseSecret.metadata.name,
            key: "username",
          },
        },
        DATABASE_PASSWORD: {
          secretKeyRef: {
            name: databaseSecret.metadata.name,
            key: "password",
          },
        },
      },
    }),

    scripts: {
      "init-database.sh": trimIndentation(`
        #!/bin/sh
        set -e

        echo "Ensuring database exists..."
        mysql -h $DATABASE_HOST -u root -e "CREATE DATABASE IF NOT EXISTS $DATABASE_NAME;"

        echo "Ensuring user exists..."
        mysql -h $DATABASE_HOST -u root -e "CREATE USER IF NOT EXISTS '$DATABASE_USER'@'%' IDENTIFIED BY '$DATABASE_PASSWORD';"

        echo "Ensuring user password is up-to-date..."
        mysql -h $DATABASE_HOST -u root -e "ALTER USER '$DATABASE_USER'@'%' IDENTIFIED BY '$DATABASE_PASSWORD';"

        echo "Ensuring user has access to database..."
        mysql -h $DATABASE_HOST -u root -e "GRANT ALL PRIVILEGES ON $DATABASE_NAME.* TO '$DATABASE_USER'@'%';"
        mysql -h $DATABASE_HOST -u root -e "FLUSH PRIVILEGES;"

        echo "Database initialization complete"
      `),
    },
  }),

  main: "/scripts/init-database.sh",
})

vaultwarden.createApplication({
  namespace,
  domain,

  ingress: {
    className: "tailscale",

    tls: {
      hosts: [hostname],
    },
  },

  databaseSecret,
  initContainers: [container],
  volumes,

  nodeSelector: k8s.mapHostnameToNodeSelector(node),
})

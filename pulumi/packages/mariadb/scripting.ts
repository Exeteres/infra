import { trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface ScriptingEnvironmentOptions {
  /**
   * The secret containing the root password for the MariaDB database.
   * Must contain a key named `mariadb-root-password`.
   */
  rootPasswordSecret: k8s.raw.core.v1.Secret

  /**
   * The extra environment to use when running the scripts.
   */
  environment?: scripting.Environment
}

export function createScriptingEnvironment(options: ScriptingEnvironmentOptions): Required<scripting.Environment> {
  return scripting.mergeEnvironments(staticEnvironment, options.environment, {
    environment: {
      MARIADB_ROOT_PASSWORD: {
        secret: options.rootPasswordSecret,
        key: "mariadb-root-password",
      },
    },
  })
}

const staticEnvironment: scripting.Environment = {
  packages: ["mariadb-client", "mariadb-backup"],

  setupScripts: {
    "configure-mysql-client.sh": trimIndentation(`
      #!/bin/sh
      set -e

      cat > /root/.my.cnf <<EOF
      [client]
      user=root
      password="$MARIADB_ROOT_PASSWORD"
      EOF
    `),
  },

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

    "online-backup.sh": trimIndentation(`
      #!/bin/sh
      set -e

      echo "| Starting online backup using mariabackup..."
      mariabackup --backup --target-dir=/data --host=$DATABASE_HOST --user=root --password="$MARIADB_ROOT_PASSWORD"
      echo "| Online backup completed"
    `),

    "post-restore.sh": trimIndentation(`
      #!/bin/sh
      set -e

      echo "| Preparing backup using mariabackup..."
      mariabackup --prepare --target-dir=/data
      echo "| Backup prepared"
    `),
  },
}

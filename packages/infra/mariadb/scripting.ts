import { trimIndentation } from "@infra/core"
import { scripting } from "@infra/scripting"

/**
 * The default script environment for MariaDB.
 * Does not include the root password secret, so it must be provided when using this environment.
 */
export const scriptEnvironment: scripting.ScriptEnvironment = {
  distro: "alpine",
  packages: ["mariadb-client"],

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
  },
}

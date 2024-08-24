import { trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface ScriptingEnvironmentOptions {
  /**
   * The secret containing the root password for the PostgreSQL database.
   * Must contain a key named `postgres-password`.
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
      PGPASSWORD: {
        secret: options.rootPasswordSecret,
        key: "postgres-password",
      },
    },
  })
}

const staticEnvironment: scripting.Environment = {
  packages: ["postgresql-client"],

  scripts: {
    "init-database.sh": trimIndentation(`
      #!/bin/sh
      set -e

      echo "Initializing database..."
      
      # Connect to postgres database to create the new database if it does not exist
      psql -h $DATABASE_HOST -U postgres -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME'" | grep -q 1 || psql -h $DATABASE_HOST -U postgres -d postgres -c "CREATE DATABASE \"$DATABASE_NAME\";"

      # Connect to the target database to create the user if it does not exist and grant privileges
      psql -h $DATABASE_HOST -U postgres -d "$DATABASE_NAME" <<EOF
      -- Check if the user exists
      SELECT usename FROM pg_catalog.pg_user WHERE usename = '$DATABASE_USER';
      
      -- If the user does not exist, create it
      DO \\$\\$
      BEGIN
          IF NOT EXISTS (SELECT usename FROM pg_catalog.pg_user WHERE usename = '$DATABASE_USER') THEN
              CREATE USER "$DATABASE_USER" WITH PASSWORD '$DATABASE_PASSWORD';
          END IF;
      END \\$\\$;
      
      -- Grant privileges on the database to the user
      GRANT ALL PRIVILEGES ON DATABASE "$DATABASE_NAME" TO "$DATABASE_USER";
      
      -- Grant schema privileges to the user
      GRANT ALL ON SCHEMA public TO "$DATABASE_USER";
      EOF

      echo "Database initialization complete"
    `),

    "online-backup.sh": trimIndentation(`
      #!/bin/sh
      set -e

      echo "| Starting online backup using pg_basebackup..."
      pg_basebackup -h $DATABASE_HOST -U postgres -D /data --checkpoint=fast --wal-method=stream
      echo "| Online backup completed"
    `),
  },
}

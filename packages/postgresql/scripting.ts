import { trimIndentation } from "@infra/core"
import { scripting } from "@infra/scripting"

/**
 * The default script environment for PostgreSQL.
 * Does not include the root password secret, so it must be provided when using this environment.
 */
export const scriptEnvironment: scripting.ScriptEnvironment = {
  distro: "alpine",
  packages: ["postgresql-client"],

  scripts: {
    "init-database.sh": trimIndentation(`
      #!/bin/sh
      set -e

      echo "Initializing database..."
      psql -h $DATABASE_HOST -U postgres <<EOF
      -- Check if the database exists
      SELECT datname FROM pg_catalog.pg_database WHERE datname = '$DATABASE_NAME';
      
      -- If the database does not exist, create it
      DO \\$\\$
      BEGIN
          IF NOT EXISTS (SELECT datname FROM pg_catalog.pg_database WHERE datname = '$DATABASE_NAME') THEN
              CREATE DATABASE "$DATABASE_NAME";
          END IF;
      END \\$\\$;
      
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
      \\c "$DATABASE_NAME"
      GRANT ALL ON SCHEMA public TO "$DATABASE_USER";
      EOF

      echo "Database initialization complete"
    `),
  },
}

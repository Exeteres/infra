import { trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface ScriptEnvironmentOptions {
  /**
   * The secret containing the root password for the MariaDB database.
   */
  rootPasswordSecret: k8s.raw.core.v1.Secret
}

export function createScriptEnvironment(options: ScriptEnvironmentOptions): scripting.ScriptEnvironment {
  return {
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

    environment: {
      MARIADB_ROOT_PASSWORD: {
        secretKeyRef: {
          name: options.rootPasswordSecret.metadata.name,
          key: "mariadb-root-password",
        },
      },
    },
  }
}

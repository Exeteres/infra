import { trimIndentation } from "@infra/core"
import { scripting } from "@infra/scripting"
import { Repository } from "./repository"
import { k8s } from "@infra/k8s"

export interface ScriptBundleOptions extends k8s.CommonOptions {
  /**
   * The repository to use for the backup.
   */
  repository: Repository

  /**
   * The extract script environment to use.
   */
  environment?: scripting.ScriptEnvironment
}

export interface ScriptBundle extends scripting.Bundle {
  /**
   * The repository to use for the backup.
   */
  repository: Repository
}

export function createScriptBundle(options: ScriptBundleOptions): ScriptBundle {
  const bundle = scripting.createBundle({
    ...options,

    environment: scripting.mergeEnvironments(options.repository.environment, options.environment, {
      distro: "alpine",

      scripts: {
        "backup.sh": trimIndentation(`
          #!/bin/sh
          set -e

          # Init the repo if it doesn't exist
          echo "| Checking the repository"
          if restic snapshots > /dev/null 2>&1; then
            echo "| Repository is ready"
          else
            echo "| Initializing new repository"
            restic init
          fi

          # Execute lock script if it exists
          if [ -f /scripts/lock.sh ]; then
            echo "| Locking the data source"
            /scripts/lock.sh || echo "| warning: lock script failed"
          else
            echo "| warning: lock script not found, possible consistency issues"
          fi

          # Unlock the data source on exit
          if [ -f /scripts/unlock.sh ]; then
            trap "echo '| Unlocking the data source'; /scripts/unlock.sh || echo '| warning: unlock script failed'" EXIT
          else
            echo "| warning: unlock script not found, possible consistency issues"
          fi

          # Backup the volume
          echo "| Backing up volume"
          restic backup -H "$RESTIC_HOSTNAME" /data $@
          echo "| Backup complete"
        `),

        "backup-on-shutdown.sh": trimIndentation(`
          #!/bin/sh
          set -e

          backup() {
            echo "| Backup on shutdown triggered, sleeping for 5 seconds and starting backup..."
            sleep 5
            /scripts/backup.sh --tag shutdown
            exit 0
          }

          trap backup SIGTERM
          echo "| Backup on shutdown enabled, waiting for shutdown signal..."

          # Wait for the shutdown signal
          while true; do sleep 1; done
        `),

        "restore.sh": trimIndentation(`
          #!/bin/sh
          set -e

          # Check if volume is not empty
          echo "| Checking if volume is empty..."
          if [ "$(ls -A /data 2>/dev/null)" ]; then
            echo "| Volume is not empty. Skipping restore."
            exit 0
          fi

          # Check if at least one snapshot exists
          if ! restic snapshots -H "$RESTIC_HOSTNAME" > /dev/null 2>&1; then
            echo "| No snapshots found. Skipping restore."
            exit 0
          fi

          # Restore the volume
          echo "| Restoring volume..."
          restic restore -H "$RESTIC_HOSTNAME" latest --target /
          echo "| Volume restored."
        `),
      },
    }),
  })

  return {
    ...bundle,
    repository: options.repository,
  }
}

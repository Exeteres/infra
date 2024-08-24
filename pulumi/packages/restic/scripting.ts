import { pulumi, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface ScriptingEnvironmentOptions extends k8s.CommonOptions {
  /**
   * The password to encrypt the repository with.
   */
  password: pulumi.Input<string>

  /**
   * The fully qualified path to the repository (in restic format).
   */
  remotePath: pulumi.Input<string>

  /**
   * The extra environment to use when running the scripts.
   */
  environment?: scripting.Environment
}

export function createScriptingEnvironment(options: ScriptingEnvironmentOptions): Required<scripting.Environment> {
  const secret = k8s.createSecret({
    name: options.name,
    namespace: options.namespace,

    data: {
      name: options.name,
      password: options.password,
      remotePath: options.remotePath,
    },
  })

  return scripting.mergeEnvironments(staticEnvironment, options.environment, {
    environment: {
      RESTIC_REPOSITORY: options.remotePath,
      RESTIC_PASSWORD_FILE: "/restic-secrets/password",
    },

    volumes: [secret],

    volumeMounts: [
      {
        volume: secret,
        mountPath: "/restic-secrets",
      },
    ],
  })
}

const staticEnvironment: scripting.Environment = {
  packages: ["restic"],

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
        /scripts/lock.sh || (echo "| error: lock script failed" && exit 1)
      fi

      # Unlock the data source on exit
      if [ -f /scripts/unlock.sh ]; then
        trap "echo '/scripts/unlock.sh || (echo '| error: unlock script failed' && exit 1)" EXIT
      fi

      # Perform online backup if the corresponding script exists
      if [ -f /scripts/online-backup.sh ]; then
        /scripts/online-backup.sh || (echo "| error: online backup script failed" && exit 1)
      fi

      # Backup the volume
      echo "| Backing up /data"
      restic backup -H "$RESTIC_HOSTNAME" /data

      # Forget old snapshots
      echo "| Forgetting old snapshots"
      restic forget --host "$RESTIC_HOSTNAME" --keep-daily 7 --keep-weekly 4 --keep-monthly 6
      echo "| Backup complete"
    `),

    "restore.sh": trimIndentation(`
      #!/bin/sh
      set -e

      # Check if /data is empty
      echo "| Checking if volume is empty..."
      if [ "$(find /data -type f -print -quit 2>/dev/null)" ]; then
        echo "| Volume is not empty. Skipping restore."
        exit 0
      fi

      # Check if at least one snapshot exists
      echo "| Checking for snapshots..."
      if ! restic snapshots -H "$RESTIC_HOSTNAME" > /dev/null 2>&1; then
        echo "| No snapshots found. Skipping restore."
        exit 0
      fi

      # Restore the volume
      echo "| Restoring /data"
      restic restore -H "$RESTIC_HOSTNAME" latest --target /
      echo "| Volume restored."

      # Post-restore script
      if [ -f /scripts/post-restore.sh ]; then
        /scripts/post-restore.sh || (echo "| error: post-restore script failed" && exit 1)
      fi
    `),
  },
}

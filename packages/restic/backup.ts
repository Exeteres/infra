import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { BackupOptions, defaultSchedule } from "./options"
import { scripting } from "@infra/scripting"
import { ScriptBundle, createScriptBundle } from "./bundle"

export interface BackupJobOptions extends k8s.CommonOptions {
  /**
   * The options for the backup.
   */
  options: BackupOptions

  /**
   * The bundle to use for the backup.
   * If not provided, it will be created automatically (not recommended).
   */
  bundle?: ScriptBundle

  /**
   * The volume claim to backup the volume of.
   */
  volumeClaim: pulumi.Input<k8s.raw.core.v1.PersistentVolumeClaim>
}

export function createBackupCronJob(options: BackupJobOptions) {
  return scripting.createWorkload({
    name: `${options.name}-backup`,
    namespace: options.namespace,

    kind: "CronJob",
    schedule: options.options.schedule ?? defaultSchedule,

    bundle:
      options.bundle ??
      createScriptBundle({
        name: options.name,
        namespace: options.namespace,
        repository: options.options.repository,
      }),

    main: "/scripts/backup.sh --tag regular",

    container: {
      volumeMounts: [
        {
          name: pulumi.output(options.volumeClaim).metadata.name,
          mountPath: "/data",
        },
      ],

      environment: {
        RESTIC_HOSTNAME: options.options.hostname,
      },
    },

    volumes: [options.volumeClaim],
  })
}

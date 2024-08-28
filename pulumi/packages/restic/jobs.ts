import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"
import { BackupOptions, defaultSchedule } from "./options"
import { appendToInputArray, Input, InputArray, output } from "@infra/core"

export interface JobOptions extends k8s.CommonOptions {
  /**
   * The options for the backup.
   */
  options: BackupOptions

  /**
   * The bundle to use for the backup and restore jobs.
   */
  bundle: scripting.Bundle

  /**
   * The volume claim to backup the volume of.
   */
  volumeClaim?: Input<k8s.raw.core.v1.PersistentVolumeClaim>

  /**
   * The sup path of the volume to restore/backup.
   */
  subPath?: string

  /**
   * The extra options for container.
   */
  container?: k8s.Container

  /**
   * Extra options to pass to the restic backup command.
   */
  backupOptions?: InputArray<string>
}

export function createRestoreJob(options: JobOptions) {
  return k8s.createJob({
    name: options.name,
    namespace: options.namespace,

    container: createContainer("restore.sh", options),
    restartPolicy: "Never",
    backoffLimit: 1,
  })
}

export function createBackupJob(options: JobOptions) {
  return k8s.createCronJob({
    name: options.name,
    namespace: options.namespace,

    schedule: options.options.schedule ?? defaultSchedule,

    container: createContainer("backup.sh", options),
    restartPolicy: "Never",
    backoffLimit: 1,
  })
}

function createContainer(main: string, options: JobOptions): Input<k8s.Container> | undefined {
  return scripting.createContainer({
    bundle: options.bundle,
    main,

    ...options.container,

    environment: {
      ...options.container?.environment,
      RESTIC_HOSTNAME: options.options.hostname,

      EXTRA_BACKUP_OPTIONS: output(options.backupOptions).apply(options => options?.join(" ")),
    },

    volumeMounts: appendToInputArray(
      options.container?.volumeMounts,
      options.volumeClaim
        ? {
            volume: options.volumeClaim,
            mountPath: "/data",
            subPath: options.subPath,
          }
        : undefined,
    ),

    volumes: appendToInputArray(options.container?.volumes, options.volumeClaim),
  })
}

export interface JobPair {
  /**
   * The backup job.
   */
  backupJob: k8s.raw.batch.v1.CronJob

  /**
   * The restore job.
   */
  restoreJob: k8s.raw.batch.v1.Job
}

/**
 * Creates a pair of jobs that can be used to backup and restore a volume.
 *
 * @param options The options for the backup and restore jobs.
 */
export function createJobPair(options: Omit<JobOptions, "name">): JobPair {
  const backupJob = createBackupJob({ name: "backup", ...options })
  const restoreJob = createRestoreJob({ name: "restore", ...options })

  return { backupJob, restoreJob }
}

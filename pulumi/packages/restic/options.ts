import { scripting } from "@infra/scripting"

export interface BackupOptions {
  /**
   * The environment to use for the backup and restore operations.
   */
  environment: scripting.Environment

  /**
   * The host name of the machine to backup.
   * Must be unique for each machine (volume) and stable over time.
   */
  hostname: string

  /**
   * The schedule for the backup.
   * By default, the backup will run every day at 3:00 AM.
   */
  schedule?: string
}

export const defaultSchedule = "0 3 * * *"

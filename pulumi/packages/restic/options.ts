import { k8s } from "@infra/k8s"
import { Repository } from "./repository"
import { ScriptBundle } from "./bundle"

export interface BackupOptions {
  /**
   * The repository to use for the backup and restore operations.
   */
  repository: Repository

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

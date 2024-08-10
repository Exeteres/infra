import { restic } from "@infra/restic"
import { k8s } from "@infra/k8s"
import { pulumi } from "@infra/core"
import { getSharedEnvironment } from "./stack"

interface BackupRepository {
  repository: restic.Repository
  backup: restic.BackupOptions
}

export function createBackupRepository(
  name: string,
  namespace: k8s.raw.core.v1.Namespace,
  backupPassword: pulumi.Input<string>,
): BackupRepository {
  const { rcloneConfig } = getSharedEnvironment()

  const repository = restic.createRepository({
    name,
    namespace,

    remotePath: `rclone:backup:${name}`,
    password: backupPassword,

    environment: restic.createRcloneEnvironment({
      namespace,
      rcloneConfig,
    }),
  })

  return {
    repository,
    backup: {
      repository,
      hostname: name,
    },
  }
}

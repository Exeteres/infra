import { restic } from "@infra/restic"
import { getSharedStack, singleton } from "./utils"
import { k8s } from "@infra/k8s"
import { pulumi } from "@infra/core"

export const getRcloneConfig = singleton(() => {
  const sharedStack = getSharedStack()

  return sharedStack.requireOutput("rcloneConfig") as pulumi.Output<string>
})

interface BackupRepository {
  repository: restic.Repository
  backup: restic.BackupOptions
}

export function createBackupRepository(
  name: string,
  namespace: k8s.raw.core.v1.Namespace,
  backupPassword: pulumi.Input<string>,
): BackupRepository {
  const repository = restic.createRepository({
    name,
    namespace,

    remotePath: `rclone:backup:${name}`,
    password: backupPassword,

    environment: restic.createRcloneEnvironment({
      namespace,
      rcloneConfig: getRcloneConfig(),
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

import { restic } from "@infra/restic"
import { k8s } from "@infra/k8s"
import { pulumi } from "@infra/core"
import { getSharedEnvironment } from "./stack"
import { memoize } from "./utils"

interface BackupRepository {
  backup: restic.BackupOptions
}

export const getRcloneEnvironment = memoize((namespace: k8s.raw.core.v1.Namespace) => {
  const { rcloneConfig } = getSharedEnvironment()

  return restic.createRcloneEnvironment({
    name: "rclone",
    namespace,
    rcloneConfig,
  })
})

export function createBackupBundle(name: string, namespace: k8s.raw.core.v1.Namespace): BackupRepository {
  const { backupPassword, backupRoot } = getSharedEnvironment()

  const environment = restic.createScriptingEnvironment({
    name,
    namespace,

    remotePath: pulumi.interpolate`${backupRoot}/${name}`,
    password: backupPassword,

    environment: getRcloneEnvironment(namespace),
  })

  return {
    backup: {
      environment,
      hostname: name,
    },
  }
}

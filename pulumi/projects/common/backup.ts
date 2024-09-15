import { restic } from "@infra/restic"
import { k8s } from "@infra/k8s"
import { pulumi } from "@infra/core"
import { getSharedEnvironment } from "./stack"
import { memoizeForNamespace } from "./utils"
import { cilium } from "@infra/cilium"
import { createAllowAlpineRegistryPolicy } from "./cilium"

interface BackupRepository {
  backup: restic.BackupOptions
}

export const getRcloneEnvironment = memoizeForNamespace((namespace: k8s.raw.core.v1.Namespace) => {
  const { rcloneConfig } = getSharedEnvironment()

  return restic.createRcloneEnvironment({
    name: "rclone",
    namespace,
    rcloneConfig,
  })
})

export function createBackupBundle(name: string, namespace: k8s.raw.core.v1.Namespace): BackupRepository {
  const { backupPassword, backupRoot, backupStorageDomains } = getSharedEnvironment()

  const environment = restic.createScriptingEnvironment({
    name,
    namespace,

    remotePath: pulumi.interpolate`${backupRoot}/${name}`,
    password: backupPassword,

    environment: getRcloneEnvironment(namespace),
  })

  createAllowAlpineRegistryPolicy(namespace)

  cilium.createAllowWebPolicy({
    name: "allow-backup-storage",
    namespace,

    description: "Allow access to storage for backups",

    domains: backupStorageDomains,
  })

  return {
    backup: {
      environment,
      hostname: name,
    },
  }
}

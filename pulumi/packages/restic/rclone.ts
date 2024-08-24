import { PartialKeys, pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface RcloneEnvironmentOptions extends k8s.CommonOptions {
  /**
   * The content of the rclone configuration file.
   */
  rcloneConfig: pulumi.Input<string>
}

export function createRcloneEnvironment(options: RcloneEnvironmentOptions): scripting.Environment {
  const rcloneConfigSecret = k8s.createSecret({
    name: options.name,
    namespace: options.namespace,

    data: {
      "rclone.conf": options.rcloneConfig,
    },
  })

  return {
    packages: ["rclone"],

    volumes: [
      {
        name: rcloneConfigSecret.metadata.name,
        secret: {
          secretName: rcloneConfigSecret.metadata.name,
          defaultMode: 0o600,
        },
      },
    ],

    volumeMounts: [
      {
        name: rcloneConfigSecret.metadata.name,
        mountPath: "/root/.config/rclone",
        readOnly: true,
      },
    ],
  }
}

import { PartialKeys, pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface RcloneEnvironmentOptions extends PartialKeys<k8s.CommonOptions, "name"> {
  /**
   * The content of the rclone configuration file.
   */
  rcloneConfig: pulumi.Input<string>
}

export function createRcloneEnvironment(options: RcloneEnvironmentOptions): scripting.ScriptEnvironment {
  const rcloneConfigSecret = k8s.createSecret({
    name: k8s.getPrefixedName("rclone-config", options.name),
    namespace: options.namespace,

    data: {
      "rclone.conf": options.rcloneConfig,
    },
  })

  return {
    distro: "alpine",
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

import { pulumi } from "@infra/core"

const config = new pulumi.Config("shared")

export const rcloneConfig = config.requireSecret("rcloneConfig")

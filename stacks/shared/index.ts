import { pulumi } from "@infra/core"

const config = new pulumi.Config("shared")

export const rcloneConfig = config.requireSecret("rcloneConfig")
export const cloudflareApiToken = config.requireSecret("cloudflareApiToken")
export const cloudflareZoneId = config.require("cloudflareZoneId")
export const nodeIpAddress = config.require("nodeIpAddress")

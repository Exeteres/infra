import { pulumi } from "@infra/core"
import * as tf from "@pulumi/terraform"
import * as path from "path"

const config = new pulumi.Config()

const terraformState = new tf.state.RemoteStateReference("terraform", {
  backendType: "local",
  path: path.join(__dirname, `../../../terraform/instances/${pulumi.getStack()}/terraform.tfstate`),
})

export const domain = config.require("domain")
export const cloudflareApiToken = config.requireSecret("cloudflareApiToken")
export const cloudflareZoneId = config.require("cloudflareZoneId")

export const rcloneConfig = config.requireSecret("rcloneConfig")
export const backupPassword = config.requireSecret("backupPassword")
export const backupRoot = config.require("backupRoot")
export const backupStorageDomains = config.requireObject<string[]>("backupStorageDomains")

export const clusterCidr = config.require("clusterCidr")
export const serviceCidr = config.require("serviceCidr")
export const tailnetName = config.require("tailnetName")

export const internalIp = terraformState.getOutput("internal_ip")
export const publicIp = terraformState.getOutput("public_ip")
export const sshPort = terraformState.getOutput("ssh_port")

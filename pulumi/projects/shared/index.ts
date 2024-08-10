import { cloudflare } from "@infra/cloudflare"
import { pulumi } from "@infra/core"
import * as tf from "@pulumi/terraform"
import * as path from "path"

const config = new pulumi.Config()

const tofuState = new tf.state.RemoteStateReference("tofu", {
  backendType: "local",
  path: path.join(__dirname, "../../../tofu/terraform.tfstate"),
})

export const domain = config.require("domain")
export const rcloneConfig = config.requireSecret("rcloneConfig")
export const cloudflareApiToken = config.requireSecret("cloudflareApiToken")
export const cloudflareZoneId = config.require("cloudflareZoneId")
export const serviceCidr = config.require("serviceCidr")
export const publicIp = tofuState.getOutput("public_ips")[pulumi.getStack()]

const provider = new cloudflare.raw.Provider("cloudflare", { apiToken: cloudflareApiToken })

cloudflare.createRecord({
  name: `k8s.${pulumi.getStack()}.${domain}`,

  value: publicIp,
  type: "A",

  zoneId: cloudflareZoneId,
  provider: provider,
})

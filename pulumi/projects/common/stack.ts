import { pulumi } from "@infra/core"
import { singleton } from "./utils"

const stackRefMap = new Map<string, pulumi.StackReference>()

export function getStack(stackName: string): pulumi.StackReference {
  let stackRef = stackRefMap.get(stackName)

  if (!stackRef) {
    stackRef = new pulumi.StackReference(`organization/${stackName}/${getEnvironmentName()}`)
    stackRefMap.set(stackName, stackRef)
  }

  return stackRef
}

export const getEnvironmentName = singleton(() => {
  const config = new pulumi.Config()
  const environment = config.get("environment")

  return environment ?? pulumi.getStack()
})

export const getSharedStack = singleton(() => getStack("shared"))

interface SharedEnvironment {
  domain: pulumi.Output<string>
  tailnetName: pulumi.Output<string>

  clusterCidr: pulumi.Output<string>
  serviceCidr: pulumi.Output<string>

  internalIp: pulumi.Output<string>
  publicIp: pulumi.Output<string>
  sshPort: pulumi.Output<number>

  cloudflareZoneId: pulumi.Output<string>
  cloudflareApiToken: pulumi.Output<string>

  rcloneConfig: pulumi.Output<string>
  backupPassword: pulumi.Output<string>
  backupRoot: pulumi.Output<string>
  backupStorageDomains: pulumi.Output<string[]>
}

export const getSharedEnvironment = singleton<SharedEnvironment>(() => {
  const stack = getSharedStack()

  return {
    domain: stack.getOutput("domain") as pulumi.Output<string>,
    tailnetName: stack.getOutput("tailnetName") as pulumi.Output<string>,

    clusterCidr: stack.getOutput("clusterCidr") as pulumi.Output<string>,
    serviceCidr: stack.getOutput("serviceCidr") as pulumi.Output<string>,

    internalIp: stack.getOutput("internalIp") as pulumi.Output<string>,
    publicIp: stack.getOutput("publicIp") as pulumi.Output<string>,
    sshPort: stack.getOutput("sshPort") as pulumi.Output<number>,

    cloudflareZoneId: stack.getOutput("cloudflareZoneId") as pulumi.Output<string>,
    cloudflareApiToken: stack.getOutput("cloudflareApiToken") as pulumi.Output<string>,

    rcloneConfig: stack.getOutput("rcloneConfig") as pulumi.Output<string>,
    backupPassword: stack.getOutput("backupPassword") as pulumi.Output<string>,
    backupRoot: stack.getOutput("backupRoot") as pulumi.Output<string>,
    backupStorageDomains: stack.getOutput("backupStorageDomains") as pulumi.Output<string[]>,
  }
})

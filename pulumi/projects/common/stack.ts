import { pulumi } from "@infra/core"
import { singleton } from "./utils"

const stackRefMap = new Map<string, pulumi.StackReference>()

export function resolveStack(stackName: string): pulumi.StackReference {
  let stackRef = stackRefMap.get(stackName)

  if (!stackRef) {
    stackRef = new pulumi.StackReference(`organization/${stackName}/${pulumi.getStack()}`)
    stackRefMap.set(stackName, stackRef)
  }

  return stackRef
}

export const getSharedStack = singleton(() => resolveStack("shared"))

interface SharedEnvironment {
  domain: pulumi.Output<string>
  publicIp: pulumi.Output<string>
  serviceCidr: pulumi.Output<string>

  cloudflareZoneId: pulumi.Output<string>
  cloudflareApiToken: pulumi.Output<string>

  rcloneConfig: pulumi.Output<string>
}

export const getSharedEnvironment = singleton<SharedEnvironment>(() => {
  const stack = getSharedStack()

  return {
    domain: stack.getOutput("domain") as pulumi.Output<string>,
    publicIp: stack.getOutput("publicIp") as pulumi.Output<string>,
    serviceCidr: stack.getOutput("serviceCidr") as pulumi.Output<string>,

    cloudflareZoneId: stack.getOutput("cloudflareZoneId") as pulumi.Output<string>,
    cloudflareApiToken: stack.getOutput("cloudflareApiToken") as pulumi.Output<string>,

    rcloneConfig: stack.getOutput("rcloneConfig") as pulumi.Output<string>,
  }
})

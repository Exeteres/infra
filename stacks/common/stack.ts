import { pulumi } from "@infra/core"

const stackRefMap = new Map<string, pulumi.StackReference>()

export function resolveStack(stackName: string): pulumi.StackReference {
  let stackRef = stackRefMap.get(stackName)

  if (!stackRef) {
    stackRef = new pulumi.StackReference(`organization/${stackName}/main`)
    stackRefMap.set(stackName, stackRef)
  }

  return stackRef
}

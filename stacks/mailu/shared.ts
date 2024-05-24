import { crds, importResource, pulumi } from "@infra/core"

const core = new pulumi.StackReference("organization/core/main")

export const publicIssuer = importResource({
  from: core,
  type: crds.certmanager.v1.ClusterIssuer,
  outputName: "publicIssuer",
  name: "public",
})

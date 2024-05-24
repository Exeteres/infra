import { CommonOptions, PartialKeys, pulumi } from "@infra/core"

export interface CommonAppOptions extends PartialKeys<CommonOptions, "name"> {
  /**
   * The node selector to deploy the application.
   * All components will be deployed to the same node unless specified otherwise.
   */
  nodeSelector?: pulumi.Input<Record<string, pulumi.Input<string>>>
}

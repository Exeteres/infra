import { CommonOptions, NodeSelectorInput, PartialKeys, pulumi } from "@infra/core"

export interface CommonAppOptions extends PartialKeys<CommonOptions, "name"> {
  /**
   * The node selector to deploy the application.
   * All components will be deployed to the same node unless specified otherwise.
   */
  nodeSelector?: NodeSelectorInput
}

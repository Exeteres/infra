export * as raw from "@pulumi/command"
import * as raw from "@pulumi/command"
import { CommonOptions, mapPulumiOptions } from "./resource"
import { pulumi } from "./imports"

export interface CommandOptions extends CommonOptions {
  /**
   * The command to run on resource creation.
   */
  create: pulumi.Input<string>

  /**
   * The command to run on resource deletion.
   */
  delete?: pulumi.Input<string>

  /**
   * The array of triggers that will cause the command to be re-run when they change.
   */
  triggers?: any[]
}

export function createCommand(options: CommandOptions) {
  return new raw.local.Command(
    options.name,
    {
      create: options.create,
      delete: options.delete,
      triggers: options.triggers,
    },
    mapPulumiOptions(options),
  )
}

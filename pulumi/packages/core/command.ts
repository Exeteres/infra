export * as raw from "@pulumi/command"
import * as raw from "@pulumi/command"
import { CommonOptions, mapPulumiOptions } from "./resource"
import { pulumi } from "./imports"
import { mapOptional } from "./utils"

export interface CommandOptions extends CommonOptions {
  /**
   * The command to run on resource creation.
   */
  create: pulumi.Input<string | string[]>

  /**
   * The command to run on resource deletion.
   */
  delete?: pulumi.Input<string | string>

  /**
   * The array of triggers that will cause the command to be re-run when they change.
   */
  triggers?: any[]
}

export function createCommand(options: CommandOptions) {
  return new raw.local.Command(
    options.name,
    {
      create: normalizeCommand(options.create),
      delete: mapOptional(normalizeCommand, options.delete),
      triggers: options.triggers,
    },
    mapPulumiOptions(options),
  )
}

function normalizeCommand(command: pulumi.Input<string | string[]>): pulumi.Output<string> {
  return pulumi.output(command).apply(command => {
    if (Array.isArray(command)) {
      return command.join(" ")
    }

    return command
  })
}

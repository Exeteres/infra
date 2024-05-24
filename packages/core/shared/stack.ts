import { pulumi } from "./imports"

export interface PublicResource {
  id: string
}

export function exportResource(resource: pulumi.CustomResource): pulumi.Output<PublicResource> {
  return pulumi.output(resource.id.apply(id => ({ id })))
}

export interface ResourceImporter<T extends pulumi.CustomResource> {
  get: (name: string, id: pulumi.Input<string>, opts?: pulumi.CustomResourceOptions) => T
}

interface ImportOptions<T extends pulumi.CustomResource> {
  from: pulumi.StackReference
  type: ResourceImporter<T>
  name: string
  outputName: string
}

export function importResource<T extends pulumi.CustomResource>(options: ImportOptions<T>): T {
  return options.type.get(
    options.name,
    options.from.getOutput(options.outputName).apply(output => output.id),
    { parent: options.from },
  )
}

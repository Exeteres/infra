import { pulumi } from "./imports"

interface ConfigOptions {
  name: string
}

export function createConfig(options: ConfigOptions) {
  return new pulumi.Config(options.name)
}

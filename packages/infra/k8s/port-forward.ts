import { pulumi } from "@infra/core"
import { getPort } from "get-port-please"
import { $ } from "execa"

export type ForwardPortOptions = {
  namespace: pulumi.Input<string>
  name: pulumi.Input<string>
  port: pulumi.Input<number>
}

/**
 * Forward the specified service port to a local port.
 * Can be used to access a service running in a Kubernetes cluster in other providers.
 *
 * @param options The options to use for forwarding the port.
 */
export function forwardPort(options: ForwardPortOptions): pulumi.Output<number> {
  return pulumi.output(options).apply(async options => {
    const port = await getPort()

    const command = $`kubectl port-forward -n ${options.namespace} service/${options.name} ${port}:${options.port}`
    process.on("exit", () => command.kill())

    command.stdout.map(data => `[${options.namespace}/${options.name}] | ${data}`).pipe(process.stdout)

    return port
  })
}

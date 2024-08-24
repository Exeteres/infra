import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { raw } from "./imports"
import { Input, Output, pulumi } from "@infra/core"

export interface ServiceOptions extends CommonOptions, raw.types.input.core.v1.ServiceSpec {}

/**
 * Create a new Service.
 *
 * @param options The options for the Service.
 * @returns The created Service.
 */
export function createService(options: ServiceOptions) {
  const service = new raw.core.v1.Service(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: options,
    },
    mapPulumiOptions(options),
  )

  return service
}

/**
 * Get the external IP of a Service of type LoadBalancer.
 *
 * @param service The Service to get the external IP of.
 * @returns The external IP of the Service.
 */
export function getServiceExternalIP(service: raw.core.v1.Service): pulumi.Output<string | undefined> {
  return service.status.loadBalancer.ingress.apply(ingress => ingress.find(i => !!i.ip)?.ip)
}

/**
 * Get the external IP of a Service of type LoadBalancer.
 * Throws an error if the Service does not have an external IP.
 *
 * @param service The Service to get the external IP of.
 * @returns The external IP of the Service.
 */
export function getRequiredServiceExternalIP(service: raw.core.v1.Service): pulumi.Output<string> {
  return getServiceExternalIP(service).apply(ip => {
    if (!ip) {
      throw new Error("Service does not have an external IP")
    }

    return ip
  })
}

/**
 * Get the port of a Service by name.
 * Throws an error if the Service does not have a port with the given name.
 *
 * @param service The Service to get the port of.
 * @param name The name of the port to get.
 * @returns The port of the Service.
 */
export function getRequiredServicePortByName(service: raw.core.v1.Service, name: string): pulumi.Output<number> {
  return service.spec.ports.apply(ports => {
    const port = ports.find(p => p.name === name)
    if (!port) {
      throw new Error(`Service does not have a port with name ${name}`)
    }

    return port.port
  })
}

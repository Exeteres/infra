import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { raw } from "./imports"
import { pulumi } from "@infra/core"

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

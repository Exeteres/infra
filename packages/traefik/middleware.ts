import { CommonOptions, mapMetadata, mapPulumiOptions } from "@infra/k8s"
import { traefik } from "./imports"
import { pulumi } from "@infra/core"

interface MiddlewareOptions extends CommonOptions {
  /**
   * The middleware spec.
   */
  spec: pulumi.Input<traefik.types.input.traefik.v1alpha1.MiddlewareSpecArgs>
}

/**
 * Create a new middleware for Traefik.
 *
 * @param options The middleware options.
 * @returns The middleware.
 */
export function createMiddleware(options: MiddlewareOptions) {
  return new traefik.traefik.v1alpha1.Middleware(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: options.spec,
    },
    mapPulumiOptions(options),
  )
}

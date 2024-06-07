import { k8s } from "@infra/k8s"
import { raw } from "./imports"
import { pulumi } from "@infra/core"

interface MiddlewareOptions extends k8s.CommonOptions {
  /**
   * The middleware spec.
   */
  spec: pulumi.Input<raw.types.input.traefik.v1alpha1.MiddlewareSpecArgs>
}

/**
 * Create a new middleware for Traefik.
 *
 * @param options The middleware options.
 * @returns The middleware.
 */
export function createMiddleware(options: MiddlewareOptions) {
  return new raw.traefik.v1alpha1.Middleware(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: options.spec,
    },
    k8s.mapPulumiOptions(options),
  )
}

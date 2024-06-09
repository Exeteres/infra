import { k8s } from "@infra/k8s"
import { raw } from "./imports"
import { normalizeInputArrayAndMap, pulumi } from "@infra/core"

export interface SidecarSetOptions extends Omit<k8s.CommonOptions, "namespace"> {
  /**
   * The configuration of the container that runs in the workload.
   */
  container?: pulumi.Input<k8s.ContainerOptions>

  /**
   * The configuration of the containers that run in the workload.
   */
  containers?: pulumi.Input<pulumi.Input<k8s.ContainerOptions>[]>

  /**
   * The selector that determines which to which pods the sidecar set should be injected.
   */
  selector: pulumi.Input<raw.types.input.apps.v1alpha1.SidecarSetSpecSelectorArgs>
}

/**
 * Create a new SidecarSet.
 *
 * @param options The options for the SidecarSet.
 * @returns The SidecarSet.
 */
export function createSidecarSet(options: SidecarSetOptions) {
  return new raw.apps.v1alpha1.SidecarSet(
    options.name,
    {
      metadata: k8s.mapMetadata(options),
      spec: {
        selector: options.selector,
        containers: normalizeInputArrayAndMap(
          //
          options.container,
          options.containers,
          c => k8s.mapContainer(options.name, c),
        ),
      },
    },
    k8s.mapPulumiOptions(options),
  )
}

import { pulumi } from "@infra/core"
import { k8s } from "./imports"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"

interface PersistentVolumeOptions extends CommonOptions {
  /**
   * The capacity of the volume.
   */
  capacity: pulumi.Input<string>
}

/**
 * Creates a persistent volume.
 *
 * @param options The options for creating the PersistentVolumeClaim.
 * @returns A new k8s.core.v1.PersistentVolumeClaim object.
 */
export function createPersistentVolumeClaim(options: PersistentVolumeOptions) {
  return new k8s.core.v1.PersistentVolumeClaim(
    options.name,
    {
      metadata: mapMetadata(options, {
        annotations: {
          ...options?.annotations,
          "pulumi.com/skipAwait": "true",
        },
      }),
      spec: {
        accessModes: ["ReadWriteOnce"],
        resources: { requests: { storage: options.capacity } },
      },
    },
    mapPulumiOptions(options),
  )
}

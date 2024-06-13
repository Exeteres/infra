import { normalizeInputArrayAndMap, pulumi } from "@infra/core"
import { raw } from "./imports"
import { mapMetadata, mapPulumiOptions } from "./options"
import { ServiceOptions } from "./service"
import { ContainerOptions, WorkloadKind, WorkloadOptions, WorkloadResources, createWorkload } from "./workload"

export interface WorkloadServiceOptions extends WorkloadOptions {
  /**
   * The configuration of the port that the service exposes.
   */
  port?: pulumi.Input<ServicePort>

  /**
   * The configuration of the ports that the service exposes.
   */
  ports?: pulumi.Input<pulumi.Input<ServicePort>[]>

  /**
   * The options to configure the service.
   */
  service?: Omit<ServiceOptions, "name" | "namespace">
}

export type ServicePort = raw.types.input.core.v1.ServicePort | number

export type TypedWorkloadServiceOptions<TWorkloadKind> = Omit<WorkloadServiceOptions, "kind"> & { kind: TWorkloadKind }

export interface WorkloadService<TWorkloadKind extends WorkloadKind> {
  /**
   * The workload resource.
   * May be a Deployment, StatefulSet, ReplicaSet, or DaemonSet.
   */
  workload: WorkloadResources[TWorkloadKind]

  /**
   * The service resource.
   */
  service: raw.core.v1.Service
}

/**
 * Creates a hybrid workload and service.
 *
 * @param options The options to configure the workload and service.
 * @returns The workload and service resources.
 */
export function createWorkloadService<T extends WorkloadKind>(
  options: TypedWorkloadServiceOptions<T>,
): WorkloadService<T> {
  const labels = {
    "app.kubernetes.io/name": options.name,
    ...options.labels,
  }

  const workload = createWorkload({
    ...options,
    labels: options.labels,
  })

  const service = new raw.core.v1.Service(
    options.name,
    {
      metadata: mapMetadata({ ...options, ...options.service }),
      spec: {
        selector: labels,
        ports: normalizeInputArrayAndMap(options.port, options.ports, mapPort),
        type: options.service?.type,
        loadBalancerClass: options.service?.loadBalancerClass,
      },
    },
    mapPulumiOptions(options),
  )

  return { workload, service }
}

function mapPort(port: ServicePort): raw.types.input.core.v1.ServicePort {
  if (typeof port === "number") {
    return { port }
  } else {
    return port
  }
}

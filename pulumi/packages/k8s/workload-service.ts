import { normalizeInputsAndMap, PartialKeys, pulumi } from "@infra/core"
import { raw } from "./imports"
import { mapMetadata, mapPulumiOptions } from "./options"
import { ServiceOptions } from "./service"
import { WorkloadKind, WorkloadOptions, WorkloadResources, createWorkload } from "./workload"

export type WorkloadServiceOptions<TWorkloadKind extends WorkloadKind> = WorkloadOptions<TWorkloadKind> & {
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
  service?: PartialKeys<Omit<ServiceOptions, "namespace">, "name">
}

export type ServicePort = raw.types.input.core.v1.ServicePort | number

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
export function createWorkloadService<TWorkloadKind extends WorkloadKind>(
  options: WorkloadServiceOptions<TWorkloadKind>,
): WorkloadService<TWorkloadKind> {
  const serviceName = options.service?.name ?? options.name

  const workload =
    options.kind === "StatefulSet"
      ? createWorkload<"StatefulSet">({
          ...options,
          kind: "StatefulSet",
          serviceName,
        })
      : createWorkload({
          ...options,
          serviceName,
        })

  const service = new raw.core.v1.Service(
    options.name,
    {
      metadata: mapMetadata({
        ...options.service,
        namespace: options.namespace,
        name: serviceName,
      }),
      spec: {
        selector: workload.spec.selector.matchLabels,
        ports: normalizeInputsAndMap(options.port, options.ports, mapPort),
        type: options.service?.type,
        loadBalancerClass: options.service?.loadBalancerClass,
      },
    },
    mapPulumiOptions(options),
  )

  return {
    workload: workload as WorkloadResources[TWorkloadKind],
    service,
  }
}

function mapPort(port: ServicePort): raw.types.input.core.v1.ServicePort {
  if (typeof port === "number") {
    return { port }
  } else {
    return port
  }
}

function mapContainerPort(port: ServicePort): raw.types.input.core.v1.ContainerPort {
  if (typeof port === "number") {
    return { containerPort: port }
  } else {
    return { containerPort: port.port }
  }
}

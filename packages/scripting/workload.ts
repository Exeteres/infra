import { k8s } from "@infra/k8s"
import { merge, pulumi } from "@infra/core"
import { ContainerOptions, createContainerSpec } from "./container"

export interface WorkloadOptions extends k8s.WorkloadOptions, ContainerOptions {}

export type TypedWorkloadOptions<TWorkloadKind> = Omit<WorkloadOptions, "kind"> & { kind: TWorkloadKind }

/**
 * Creates a new script workload with the specified options.
 *
 * @param options The options to create the workload.
 * @returns The workload resource.
 */
export function createWorkload<T extends k8s.WorkloadKind>(options: TypedWorkloadOptions<T>): k8s.WorkloadResources[T] {
  const { container, volumes } = createContainerSpec({
    name: options.name,
    namespace: options.namespace,

    bundle: options.bundle,
    main: options.main,
  })

  return k8s.createWorkload({
    ...options,

    container: pulumi.all([container, options.container]).apply(([container, extraOptions]) => ({
      ...container,
      ...extraOptions,

      env: [...(container.env ?? []), ...(extraOptions?.env ?? [])],
      volumeMounts: [...(container.volumeMounts ?? []), ...(extraOptions?.volumeMounts ?? [])],

      environment: extraOptions?.environment,
    })),

    volumes: pulumi.output(options.volumes).apply(extraOptions => [
      //
      ...volumes,
      ...(extraOptions ?? []),
    ]),
  })
}

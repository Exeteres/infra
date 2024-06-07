import { k8s } from "@infra/k8s"

export interface ServiceAccountOptions extends Omit<k8s.CommonOptions, "name"> {
  /**
   * The name of the service account.
   */
  name?: string
}

/**
 * Creates a service account for the Kubernetes dashboard and binds it to the cluster-admin role.
 *
 * @param options The options for the service account.
 * @returns The service account.
 */
export function createServiceAccount(options: ServiceAccountOptions) {
  const name = options.name ?? "kubernetes-dashboard"

  return k8s.createServiceAccount({
    name,
    role: k8s.raw.rbac.v1.ClusterRole.get("cluster-admin", "cluster-admin"),

    ...options,
  })
}

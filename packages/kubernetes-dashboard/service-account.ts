import { CommonOptions, k8s, mapMetadata, mapPulumiOptions } from "@infra/k8s"

/**
 * Creates a service account for the Kubernetes dashboard and binds it to the cluster-admin role.
 *
 * @param options The options for the service account.
 * @returns The service account.
 */
export function createKubernetesDashboardServiceAccount(options: CommonOptions) {
  const serviceAccount = new k8s.core.v1.ServiceAccount(
    options.name,
    { metadata: mapMetadata(options) },
    mapPulumiOptions(options),
  )

  void new k8s.rbac.v1.ClusterRoleBinding(
    options.name,
    {
      metadata: mapMetadata(options),
      roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "cluster-admin",
      },
      subjects: [
        {
          kind: "ServiceAccount",
          name: serviceAccount.metadata.name,
          namespace: options.namespace.metadata.name,
        },
      ],
    },
    mapPulumiOptions(options, { dependsOn: serviceAccount }),
  )

  return serviceAccount
}

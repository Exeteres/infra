import { normalizeInputArray, pulumi } from "@infra/core"
import { k8s } from "./imports"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { createRoleBinding } from "./role-binding"

interface ServiceAccountOptions extends CommonOptions {
  /**
   * The role to bind to the service account.
   */
  role?: pulumi.Input<k8s.rbac.v1.Role>

  /**
   * The roles to bind to the service account.
   */
  roles?: pulumi.Input<pulumi.Input<k8s.rbac.v1.Role>[]>
}

interface ServiceAccountResult {
  /**
   * The created service account.
   */
  serviceAccount: k8s.core.v1.ServiceAccount

  /**
   * The bindings created for the service account roles.
   */
  bindings: pulumi.Output<k8s.rbac.v1.RoleBinding[]>
}

/**
 * Creates a new ServiceAccount and binds it to the specified roles.
 *
 * @param options The options for creating the service account.
 * @returns The created service account and bindings.
 */
export function createServiceAccount(options: ServiceAccountOptions): ServiceAccountResult {
  const serviceAccount = new k8s.core.v1.ServiceAccount(
    options.name,
    {
      metadata: mapMetadata(options),
    },
    mapPulumiOptions(options),
  )

  const bindings = pulumi.output(normalizeInputArray(options.role, options.roles)).apply(roles =>
    roles.map(role => {
      return createRoleBinding({
        name: `${options.name}-${role.metadata.name}`,
        namespace: options.namespace,

        subject: serviceAccount,
        role,
      })
    }),
  )

  return {
    serviceAccount,
    bindings,
  }
}

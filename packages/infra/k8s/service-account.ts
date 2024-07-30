import { normalizeInputArray, pulumi } from "@infra/core"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { raw } from "./imports"
import { createRoleBinding } from "./role-binding"
import type { Role } from "./role"
import { k8s } from "."

interface ServiceAccountOptions extends CommonOptions {
  /**
   * The role to bind to the service account.
   */
  role?: pulumi.Input<Role>

  /**
   * The roles to bind to the service account.
   */
  roles?: pulumi.Input<pulumi.Input<Role>[]>
}

interface ServiceAccountResult {
  /**
   * The created service account.
   */
  serviceAccount: raw.core.v1.ServiceAccount

  /**
   * The bindings created for the service account roles.
   */
  bindings: pulumi.Output<raw.rbac.v1.RoleBinding[]>
}

/**
 * Creates a new ServiceAccount and binds it to the specified roles.
 *
 * @param options The options for creating the service account.
 * @returns The created service account and bindings.
 */
export function createServiceAccount(options: ServiceAccountOptions): ServiceAccountResult {
  const serviceAccount = new raw.core.v1.ServiceAccount(
    options.name,
    {
      metadata: mapMetadata(options),
    },
    mapPulumiOptions(options),
  )

  const bindings = pulumi.output(normalizeInputArray(options.role, options.roles)).apply(roles => {
    return roles.map(role => {
      return role.metadata.name.apply(name => {
        return createRoleBinding({
          name: `${options.name}-${name}`,
          namespace: options.namespace,
          isClusterScoped: k8s.raw.rbac.v1.ClusterRole.isInstance(role),

          subject: serviceAccount,
          role,
        })
      })
    })
  })

  return {
    serviceAccount,
    bindings: bindings as unknown as pulumi.Output<raw.rbac.v1.RoleBinding[]>,
  }
}

import { normalizeInputArrayAndMap, pulumi } from "@infra/core"
import { k8s } from "./imports"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"

export interface RoleBindingOptions extends CommonOptions {
  /**
   * The role to bind.
   */
  role: pulumi.Input<k8s.rbac.v1.Role>

  /**
   * The subject to bind the role to.
   */
  subject?: pulumi.Input<RoleBindingSubjct>

  /**
   * The subjects to bind the role to.
   */
  subjects?: pulumi.Input<pulumi.Input<RoleBindingSubjct>[]>
}

export type RoleBindingSubjct = k8s.core.v1.ServiceAccount

/**
 * Creates a role binding.
 *
 * @param options The role binding options.
 * @returns The role binding.
 */
export function createRoleBinding(options: RoleBindingOptions) {
  return new k8s.rbac.v1.RoleBinding(
    options.name,
    {
      metadata: mapMetadata(options),
      roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "Role",
        name: pulumi.output(options.role).apply(role => role.metadata.name),
      },
      subjects: normalizeInputArrayAndMap(options.subject, options.subjects, mapSubject),
    },
    mapPulumiOptions(options),
  )
}

function mapSubject(subject: pulumi.Input<RoleBindingSubjct>): pulumi.Input<k8s.types.input.rbac.v1.Subject> {
  return pulumi.output(subject).apply(s => ({
    kind: s.kind,
    name: s.metadata.name,
    namespace: s.metadata.namespace,
  }))
}

import { mapInputs, normalizeInputs, pulumi } from "@infra/core"
import { raw } from "./imports"
import { ScopedOptions, mapMetadata, mapPulumiOptions } from "./options"
import type { Role } from "./role"

export type RoleBindingOptions = ScopedOptions & {
  /**
   * The role to bind.
   */
  role: pulumi.Input<Role>

  /**
   * The subject to bind the role to.
   */
  subject?: pulumi.Input<RoleBindingSubjct>

  /**
   * The subjects to bind the role to.
   */
  subjects?: pulumi.Input<pulumi.Input<RoleBindingSubjct>[]>
}

export type RoleBindingSubjct = raw.core.v1.ServiceAccount
export type RoleBinding = raw.rbac.v1.RoleBinding | raw.rbac.v1.ClusterRoleBinding

/**
 * Creates a role binding.
 *
 * @param options The role binding options.
 * @returns The role binding.
 */
export function createRoleBinding(options: RoleBindingOptions): RoleBinding {
  const Resource = options.isClusterScoped ? raw.rbac.v1.ClusterRoleBinding : raw.rbac.v1.RoleBinding

  return new Resource(
    options.name,
    {
      metadata: mapMetadata(options),
      roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: pulumi.output(options.role).apply(role => role.kind),
        name: pulumi.output(options.role).apply(role => role.metadata.name),
      },
      subjects: mapInputs(normalizeInputs(options.subject, options.subjects), mapSubject),
    },
    mapPulumiOptions(options),
  )
}

function mapSubject(subject: pulumi.Input<RoleBindingSubjct>): pulumi.Input<raw.types.input.rbac.v1.Subject> {
  return pulumi.output(subject).apply(s => ({
    kind: s.kind,
    name: s.metadata.name,
    namespace: s.metadata.namespace,
  }))
}

import { normalizeInputs, pulumi } from "@infra/core"
import { raw } from "./imports"
import { RoleBinding, RoleBindingSubjct, createRoleBinding } from "./role-binding"
import { ScopedOptions, mapMetadata, mapPulumiOptions } from "./options"

type RoleOptions = ScopedOptions & {
  /**
   * The rule for the role.
   */
  rule?: pulumi.Input<raw.types.input.rbac.v1.PolicyRule>

  /**
   * The rules for the role.
   */
  rules?: pulumi.Input<pulumi.Input<raw.types.input.rbac.v1.PolicyRule>[]>

  /**
   * The subject to bind to the role.
   */
  subject?: pulumi.Input<RoleBindingSubjct>

  /**
   * The subjects to bind to the role.
   */
  subjects?: pulumi.Input<pulumi.Input<RoleBindingSubjct>[]>
}

export interface RoleBundle {
  /**
   * The created Role.
   */
  role: Role

  /**
   * The binding created for the Role and its subjects if any.
   */
  binding?: RoleBinding
}

export type Role = raw.rbac.v1.Role | raw.rbac.v1.ClusterRole

/**
 * Creates a Role with the given options and optionally binds the given subjects to it.
 *
 * @param options The options for the Role.
 * @returns The Role and the RoleBinding if subjects were provided.
 */
export function createRole(options: RoleOptions): RoleBundle {
  const role = new raw.rbac.v1.Role(
    options.name,
    {
      metadata: mapMetadata(options),
      rules: normalizeInputs(options.rule, options.rules),
    },
    mapPulumiOptions(options),
  )

  if (options.subject || options.subjects) {
    const binding = createRoleBinding({
      name: options.name,
      namespace: "namespace" in options ? options.namespace : undefined!,
      isClusterScoped: options.isClusterScoped,

      role,
      subject: options.subject,
      subjects: options.subjects,
    })

    return { role, binding }
  }

  return { role }
}

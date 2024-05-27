import { normalizeInputArray, pulumi } from "@infra/core"
import { k8s } from "./imports"
import { CommonOptions, mapMetadata, mapPulumiOptions } from "./options"
import { RoleBindingSubjct, createRoleBinding } from "./role-binding"

interface RoleOptions extends CommonOptions {
  /**
   * The rule for the role.
   */
  rule?: pulumi.Input<k8s.types.input.rbac.v1.PolicyRule>

  /**
   * The rules for the role.
   */
  rules?: pulumi.Input<pulumi.Input<k8s.types.input.rbac.v1.PolicyRule>[]>

  /**
   * The subject to bind to the role.
   */
  subject?: pulumi.Input<RoleBindingSubjct>

  /**
   * The subjects to bind to the role.
   */
  subjects?: pulumi.Input<pulumi.Input<RoleBindingSubjct>[]>
}

interface RoleResult {
  /**
   * The created Role.
   */
  role: k8s.rbac.v1.Role

  /**
   * The binding created for the Role and its subjects if any.
   */
  binding?: k8s.rbac.v1.RoleBinding
}

/**
 * Creates a Role with the given options and optionally binds the given subjects to it.
 *
 * @param options The options for the Role.
 * @returns The Role and the RoleBinding if subjects were provided.
 */
export function createRole(options: RoleOptions): RoleResult {
  const role = new k8s.rbac.v1.Role(
    options.name,
    {
      metadata: mapMetadata(options),
      rules: normalizeInputArray(options.rule, options.rules),
    },
    mapPulumiOptions(options),
  )

  if (options.subject || options.subjects) {
    const binding = createRoleBinding({
      name: options.name,
      namespace: options.namespace,

      role,
      subject: options.subject,
      subjects: options.subjects,
    })

    return { role, binding }
  }

  return { role }
}

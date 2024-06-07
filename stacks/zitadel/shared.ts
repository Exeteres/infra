import { certManager } from "@infra/cert-manager"
import { pulumi, resource } from "@infra/core"

const core = new pulumi.StackReference("organization/core/main")

export const publicIssuer = resource.import<certManager.Issuer>(core, "publicIssuer")
export const plainIssuer = resource.import<certManager.Issuer>(core, "plainIssuer")

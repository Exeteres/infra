import { certManager } from "@infra/cert-manager"
import { pulumi, resource } from "@infra/core"

import "@infra/cert-manager"

const core = new pulumi.StackReference("organization/core/main")

export const publicIssuer = resource.import<certManager.Issuer>(core, "publicIssuer")

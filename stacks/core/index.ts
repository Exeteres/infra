import { resource } from "@infra/core"
import { plainIssuer as _plainIssuer, publicIssuer as _publicIssuer } from "./cert-manager"

import "./kubernetes-dashboard"
import "./kruise"
import "./tailscale"

export const publicIssuer = resource.export(_publicIssuer)
export const plainIssuer = resource.export(_plainIssuer)

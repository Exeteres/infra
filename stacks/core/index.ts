import { resource } from "@infra/core"
import { plainIssuer as _plainIssuer, publicIssuer as _publicIssuer } from "./cert-manager"

import "./kubernetes-dashboard"
import "./kruise"

export const publicIssuer = resource.export(_publicIssuer)
export const plainIssuer = resource.export(_plainIssuer)

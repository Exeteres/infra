import { exportResource } from "@infra/core"
import { plainIssuer as _plainIssuer, publicIssuer as _publicIssuer } from "./cert-manager"

import "./kubernetes-dashboard"
import "./kruise"

export const publicIssuer = exportResource(_publicIssuer)
export const plainIssuer = exportResource(_plainIssuer)

import { resource } from "@infra/core"
import { raw } from "./imports"

export * as certManager from "./exports"

resource.registerType("kubernetes:cert-manager.io/v1:ClusterIssuer", raw.certmanager.v1.ClusterIssuer)

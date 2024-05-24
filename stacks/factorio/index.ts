import { createFactorioApp } from "@infra/apps"
import { createConfig, createNamespace, createSecret } from "@infra/core"

const namespace = createNamespace({ name: "factorio" })
const config = createConfig({ name: "factorio" })

const passwordSecret = createSecret({
  name: "server-password",
  namespace,

  key: "game_password",
  value: config.require("password"),
})

createFactorioApp({
  namespace,

  passwordSecret,
  admins: [config.require("admin")],

  nodeSelector: {
    "kubernetes.io/hostname": config.require("node"),
  },
})

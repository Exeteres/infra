import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { factorio } from "@infra/factorio"

const namespace = k8s.createNamespace({ name: "factorio" })
const config = new pulumi.Config("factorio")

const passwordSecret = k8s.createSecret({
  name: "factorio-server-password",
  namespace,

  key: "game_password",
  value: config.require("password"),
})

factorio.createApplication({
  namespace,

  passwordSecret,
  admins: [config.require("admin")],

  nodeSelector: {
    "kubernetes.io/hostname": config.require("node"),
  },
})

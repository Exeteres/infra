import { createHelmChart, createNamespace, createSecret, nodes, storageClasses } from "../common"

const { namespace, config } = createNamespace({ name: "factorio" })

const secret = createSecret({
  name: "server-password",
  namespace,

  key: "game_password",
  value: config.requireSecret("server-password"),
})

void createHelmChart({
  name: "factorio",
  namespace,

  chart: "factorio-server-charts",
  repo: "https://sqljames.github.io/factorio-server-charts/",
  version: "1.2.5",

  values: {
    nodeSelector: nodes.publicNsk.nodeSelector,

    image: {
      tag: "1.1.107",
    },

    rcon: {
      external: false,
    },

    persistence: {
      storageClassName: storageClasses.encrypted,
    },

    serverPassword: {
      passwordSecret: secret.metadata.name,
    },

    admin_list: [config.require("admin")],
  },
})

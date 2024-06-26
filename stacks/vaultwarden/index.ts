import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { scripting } from "@infra/scripting"
import { vaultwarden } from "@infra/vaultwarden"

const config = new pulumi.Config("vaultwarden")

const domain = config.require("domain")
const hostname = config.require("hostname")
const nodeSelector = config.requireObject<k8s.NodeSelector>("nodeSelector")
const databasePassword = config.requireSecret("databasePassword")

const namespace = k8s.createNamespace({ name: "vaultwarden" })

const mariadbStack = new pulumi.StackReference("organization/mariadb/main")
const mariadbRootPassword = mariadbStack.getOutput("rootPassword")

const mariadbRootPasswordSecret = k8s.createSecret({
  name: "mariadb-root-password",
  namespace,

  key: "mariadb-root-password",
  value: mariadbRootPassword,
})

const bundle = scripting.createBundle({
  name: "vaultwarden-mariadb",
  namespace,
  environment: mariadb.scriptEnvironment,
})

const { initContainer, secret, volumes } = mariadb.createDatabase({
  name: "vaultwarden",
  namespace,

  host: "mariadb.mariadb",
  bundle,
  password: databasePassword,

  rootPasswordSecret: mariadbRootPasswordSecret,
})

vaultwarden.createApplication({
  namespace,
  domain,

  ingress: {
    className: "tailscale",

    tls: {
      hosts: [hostname],
    },
  },

  databaseSecret: secret,
  initContainers: [initContainer],
  volumes,

  nodeSelector,
})

import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"
import { plane } from "@infra/plane"
import { postgresql } from "@infra/postgresql"
import { exposeInternalService } from "@stacks/common"

const namespace = k8s.createNamespace({ name: "plane" })

const config = new pulumi.Config("plane")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")
const s3AccessKey = config.require("s3AccessKey")
const s3SecretKey = config.requireSecret("s3SecretKey")
const s3Region = config.require("s3Region")
const s3Bucket = config.require("s3Bucket")
const s3Endpoint = config.require("s3Endpoint")
const secretKey = config.getSecret("secretKey")

const postgresqlStack = new pulumi.StackReference("organization/postgresql/main")
const postgresRootPassword = postgresqlStack.getOutput("rootPassword")

const bundle = scripting.createBundle({
  name: "plane-postgresql",
  namespace,
  environment: postgresql.scriptEnvironment,
})

const { secret } = postgresql.createDatabase({
  name: "plane",
  namespace,

  host: "postgresql.postgresql",
  bundle,
  password: databasePassword,

  rootPasswordSecret: k8s.createSecret({
    name: "postgres-root-password",
    namespace,

    key: "postgres-password",
    value: postgresRootPassword,
  }),
})

const s3Secret = k8s.createSecret({
  name: k8s.getPrefixedName("s3-credentials", "plane"),
  namespace,

  realName: "s3-credentials",

  data: {
    access_key: s3AccessKey,
    secret_key: s3SecretKey,
    bucket: s3Bucket,
    region: s3Region,
    endpoint: s3Endpoint,
  },
})

const { gateway } = exposeInternalService(namespace, domain)

plane.createApplication({
  namespace,

  gateway,
  databaseSecret: secret,

  s3Secret,
  secretKey,
})

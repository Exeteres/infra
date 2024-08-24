import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { plane } from "@infra/plane"
import { createPostgresqlDatabase, exposeInternalHttpService } from "@projects/common"

const namespace = k8s.createNamespace({ name: "plane" })

const config = new pulumi.Config("plane")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")
const s3AccessKey = config.require("s3AccessKey")
const s3SecretKey = config.requireSecret("s3SecretKey")
const s3Region = config.require("s3Region")
const s3Bucket = config.require("s3Bucket")
const s3Endpoint = config.require("s3Endpoint")
const secretKey = config.requireSecret("secretKey")

const { gateway } = exposeInternalHttpService({ namespace, domain })
const { credentials } = createPostgresqlDatabase("plane", namespace, databasePassword)

plane.createApplication({
  namespace,

  gateway,
  databaseCredentials: credentials,

  s3Credentials: {
    host: "s3.exeteres.me",
    accessKey: s3AccessKey,
    secretKey: s3SecretKey,
    bucket: s3Bucket,
    region: s3Region,
    endpoint: s3Endpoint,
  },

  secretKey,
})

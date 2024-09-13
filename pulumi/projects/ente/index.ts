import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { ente } from "@infra/ente"
import {
  createAllowSmtpServerPolicy,
  createPostgresqlDatabase,
  exposeInternalHttpService,
  getInternalGatewayService,
  getSmtpCredentials,
} from "@projects/common"
import { cilium } from "@infra/cilium"

const namespace = k8s.createNamespace({ name: "ente" })

const config = new pulumi.Config()
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")

const keyEncryption = config.requireSecret("keyEncryption")
const keyHash = config.requireSecret("keyHash")
const jwtSecret = config.requireSecret("jwtSecret")

const s3AccessKey = config.require("s3AccessKey")
const s3SecretKey = config.requireSecret("s3SecretKey")
const s3Region = config.require("s3Region")
const s3Bucket = config.require("s3Bucket")
const s3Domain = config.require("s3Domain")

const emailFrom = config.require("emailFrom")

const { routes } = exposeInternalHttpService({ namespace, domain })
const { credentials } = createPostgresqlDatabase("ente", namespace, databasePassword)

ente.createApplication({
  namespace,
  domain,

  routes,
  databaseCredentials: credentials,

  key: {
    encryption: keyEncryption,
    hash: keyHash,
  },

  jwt: {
    secret: jwtSecret,
  },

  s3Credentials: {
    host: s3Domain,
    accessKey: s3AccessKey,
    secretKey: s3SecretKey,
    bucket: s3Bucket,
    region: s3Region,
    endpoint: `https://${s3Domain}`,
  },

  smtp: {
    credentials: getSmtpCredentials(),
    from: emailFrom,
  },
})

cilium.createAllowServicePolicy({
  name: "allow-minio",
  namespace,

  description: "Allow to access Minio",
  service: getInternalGatewayService(),
})

createAllowSmtpServerPolicy(namespace)
import { cilium } from "@infra/cilium"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { plane } from "@infra/plane"
import {
  createAllowSmtpServerPolicy,
  createPostgresqlDatabase,
  exposeInternalHttpService,
  getInternalGatewayService,
} from "@projects/common"

const namespace = k8s.createNamespace({ name: "plane" })

const config = new pulumi.Config("plane")
const domain = config.require("domain")
const databasePassword = config.requireSecret("databasePassword")

const s3AccessKey = config.require("s3AccessKey")
const s3SecretKey = config.requireSecret("s3SecretKey")
const s3Region = config.require("s3Region")
const s3Bucket = config.require("s3Bucket")
const s3Domain = config.require("s3Domain")
const secretKey = config.requireSecret("secretKey")

const { routes } = exposeInternalHttpService({ namespace, domain })
const { credentials } = createPostgresqlDatabase("plane", namespace, databasePassword)

cilium.createAllowInsideNamespacePolicy({ namespace })

cilium.createAllowServicePolicy({
  name: "allow-minio",
  namespace,

  description: "Allow to access Minio",
  service: getInternalGatewayService(),
})

createAllowSmtpServerPolicy(namespace)

cilium.createAllowWebPolicy({
  name: "allow-smtp-server-2",
  namespace,

  description: "Allow to access SMTP server",
  domain: "smtp.yandex.ru",
})

plane.createApplication({
  namespace,

  routes,
  databaseCredentials: credentials,

  s3Credentials: {
    host: s3Domain,
    accessKey: s3AccessKey,
    secretKey: s3SecretKey,
    bucket: s3Bucket,
    region: s3Region,
    endpoint: `https://${s3Domain}`,
  },

  secretKey,
})

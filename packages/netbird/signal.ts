import { publicIssuer } from "@infra/cert-manager"
import { createCertificate, createDeploymentService, createIngressRoute } from "../common"
import { namespace, signalDomain } from "./shared"

export const signal = createDeploymentService({
  name: "signal",
  namespace,

  image: "netbirdio/signal:0.27.7",

  ports: [{ port: 80 }],
})

const { secretName: signalCertSecretName } = createCertificate({
  name: "signal",
  namespace,

  domain: signalDomain,
  issuer: publicIssuer,
})

void createIngressRoute({
  name: "signal",
  namespace,

  domain: signalDomain,

  serviceName: "signal",
  servicePort: 80,
  serviceScheme: "h2c",

  tlsSecretName: signalCertSecretName,
})

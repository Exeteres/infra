import { createCertificate, createIngressRoute } from "../common"
import { dashboard } from "./dashboard"
import { management } from "./management"
import { domain, namespace } from "./shared"
import { signal } from "./signal"
import { namespace as zitadelNamespace } from "../zitadel/shared"
import { publicIssuer } from "../cert-manager"

void createCertificate({
  name: "public",
  namespace,

  domain,
  issuer: publicIssuer,
})

void createIngressRoute({
  name: "dashboard",
  namespace,

  domain,
  enableHttpToHttpsRedirect: true,
  path: "/",

  serviceName: dashboard.metadata.name,
  servicePort: 80,
})

void createIngressRoute({
  name: "dashboard-oidc",
  namespace: zitadelNamespace,

  domain,
  passHostHeader: false,
  path: "/.well-known/openid-configuration",

  serviceName: "zitadel",
  servicePort: 8080,
})

void createIngressRoute({
  name: "management-http",
  namespace,

  domain,
  path: "/api",

  serviceName: management.metadata.name,
  servicePort: 8080,
})

void createIngressRoute({
  name: "management-grpc",
  namespace,

  domain,
  path: "/management.ManagementService/",

  serviceName: management.metadata.name,
  servicePort: 8080,
  serviceScheme: "h2c",
})

void createIngressRoute({
  name: "signal",
  namespace,

  domain,
  path: "/signalexchange.SignalExchange/",

  serviceName: signal.metadata.name,
  servicePort: 80,
  serviceScheme: "h2c",
})

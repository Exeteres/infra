import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { certManager } from "@infra/cert-manager"
import { traefik } from "@infra/traefik"

export function createDashboardService(
  namespace: k8s.raw.core.v1.Namespace,
  publicIssuer: certManager.Issuer,
  zitadelClientId: pulumi.Input<string>,
  zitadelUrl: pulumi.Input<string>,
  managementDomain: pulumi.Input<string>,
  dashboardDomain: pulumi.Input<string>,
) {
  const { service } = k8s.createWorkloadService({
    name: "dashboard",
    namespace,

    kind: "Deployment",

    container: {
      image: "netbirdio/dashboard:v2.3.0",

      environment: {
        NETBIRD_MGMT_API_ENDPOINT: pulumi.interpolate`https://${managementDomain}`,
        NETBIRD_MGMT_GRPC_API_ENDPOINT: pulumi.interpolate`https://${managementDomain}`,

        AUTH_AUDIENCE: zitadelClientId,
        AUTH_CLIENT_ID: zitadelClientId,
        AUTH_AUTHORITY: zitadelUrl,
        USE_AUTH0: "false",

        AUTH_SUPPORTED_SCOPES: "openid profile email offline_access",
        AUTH_REDIRECT_URI: "/auth",
        AUTH_SILENT_REDIRECT_URI: "/silent-auth",
      },
    },

    port: 80,
  })

  const { secretName: dashboardSecretName } = certManager.createCertificate({
    name: "dashboard",
    namespace,

    domain: dashboardDomain,
    issuer: publicIssuer,
  })

  const ingressRoute = traefik.createIngressRoute({
    name: "dashboard",
    namespace,

    route: {
      domain: dashboardDomain,
      path: "/",

      service,
    },

    tlsSecretName: dashboardSecretName,
  })

  return { service, ingressRoute }
}

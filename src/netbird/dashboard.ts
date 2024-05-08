import { createReplicaService } from "../common"
import { authClientId, authZitadelUrl, domain, namespace } from "./shared"

export const dashboard = createReplicaService({
  name: "dashboard",
  namespace,

  image: "netbirdio/dashboard",

  ports: [{ name: "http", port: 80 }],

  environment: {
    NETBIRD_MGMT_API_ENDPOINT: `https://${domain}`,
    NETBIRD_MGMT_GRPC_API_ENDPOINT: `https://${domain}`,

    AUTH_AUDIENCE: authClientId,
    AUTH_CLIENT_ID: authClientId,
    AUTH_AUTHORITY: authZitadelUrl,
    USE_AUTH0: "false",

    AUTH_SUPPORTED_SCOPES: "openid profile email offline_access",
    AUTH_REDIRECT_URI: "/nb-auth",
    AUTH_SILENT_REDIRECT_URI: "/nb-silent-auth",
  },
})

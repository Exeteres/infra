import { certManager } from "@infra/cert-manager"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export function createManagementService(
  namespace: k8s.raw.core.v1.Namespace,
  managementDomain: pulumi.Input<string>,
  dnsDomain: pulumi.Input<string>,
  publicIssuer: certManager.Issuer,
  turnPassword: pulumi.Input<string>,
  encryptionKey: pulumi.Input<string>,
  zitadelServiceUserPassword: pulumi.Input<string>,
  zitadelUrl: pulumi.Input<string>,
  zitadelClientId: pulumi.Input<string>,
  zitadelServiceUserName: pulumi.Input<string>,
  signalDomain: pulumi.Input<string>,
  dashboardDomain: pulumi.Input<string>,
) {
  const { secretName: managementSecretName } = certManager.createCertificate({
    name: "management",
    namespace,

    domain: managementDomain,
    issuer: publicIssuer,
  })

  const managementConfigSecret = k8s.createSecret({
    name: "management-config",
    namespace,

    key: "management.json",
    value: pulumi
      .all([turnPassword, encryptionKey, zitadelServiceUserPassword])
      .apply(([turnPassword, encryptionKey, zitadelServiceUserPassword]) => {
        return JSON.stringify({
          Stuns: [
            {
              Proto: "udp",
              URI: `stun:stun.l.google.com:19302`,
              Username: "",
              Password: null,
            },
          ],
          TURNConfig: {
            Turns: [],
            CredentialsTTL: "12h",
            Secret: "secret",
            TimeBasedCredentials: false,
          },
          Signal: {
            Proto: "https",
            URI: `${signalDomain}:443`,
            Username: "",
            Password: null,
          },
          ReverseProxy: {
            TrustedHTTPProxies: [],
            TrustedHTTPProxiesCount: 0,
            TrustedPeers: ["0.0.0.0/0"],
          },
          DataStoreEncryptionKey: encryptionKey,
          StoreConfig: {
            Engine: "sqlite",
          },
          HttpConfig: {
            Address: `0.0.0.0:8080`,
            AuthIssuer: zitadelUrl,
            AuthAudience: zitadelClientId,
            CertFile: "/etc/netbird/certs/tls.crt",
            CertKey: "/etc/netbird/certs/tls.key",
            IdpSignKeyRefreshEnabled: true,
            OIDCConfigEndpoint: `${zitadelUrl}/.well-known/openid-configuration`,
          },
          IdpManagerConfig: {
            ManagerType: "zitadel",
            ClientConfig: {
              ClientID: zitadelServiceUserName,
              ClientSecret: zitadelServiceUserPassword,
              GrantType: "client_credentials",
              TokenEndpoint: `${zitadelUrl}/oauth/v2/token`,
            },
            ExtraConfig: {
              ManagementEndpoint: `${zitadelUrl}/management/v1`,
            },
          },
          DeviceAuthorizationFlow: {
            Provider: "hosted",
            ProviderConfig: {
              Audience: zitadelClientId,
              ClientID: zitadelClientId,
              ClientSecret: "",
              TokenEndpoint: `${zitadelUrl}/oauth/v2/token`,
              DeviceAuthEndpoint: `${zitadelUrl}/oauth/v2/device_authorization`,
              Scope: "openid email",
              UseIDToken: false,
              RedirectURLs: null,
            },
          },
          PKCEAuthorizationFlow: {
            ProviderConfig: {
              Audience: zitadelClientId,
              ClientID: zitadelClientId,
              Domain: dashboardDomain,
              AuthorizationEndpoint: `${zitadelUrl}/oauth/v2/authorize`,
              TokenEndpoint: `${zitadelUrl}/oauth/v2/token`,
              Scope: "openid profile email offline_access api",
              RedirectURLs: [`https://${dashboardDomain}/auth`],
              UseIDToken: false,
            },
          },
        })
      }),
  })

  const management = k8s.createWorkloadService({
    name: "management",
    namespace,

    container: {
      image: "netbirdio/management:0.27.7",

      args: [
        "--port=8080",
        "--log-file=console",
        "--log-level=info",
        "--disable-anonymous-metrics=true",
        `--single-account-mode-domain=${managementDomain}`,
        `--dns-domain=${dnsDomain}`,
      ],
    },

    volumes: [
      {
        name: "config",
        secret: {
          secretName: managementConfigSecret.metadata.name,
          items: [{ key: "management.json", path: "management.json" }],
        },
      },
      {
        name: "certs",
        secret: {
          secretName: managementSecretName,
        },
      },
    ],

    volumeMounts: [
      {
        name: "config",
        mountPath: "/etc/netbird/management.json",
        subPath: "management.json",
        readOnly: true,
      },
      {
        name: "data",
        mountPath: "/var/lib/netbird",
      },
      {
        name: "certs",
        mountPath: "/etc/netbird/certs",
      },
    ],

    ports: [{ port: 8080 }],
  })

  void createTcpIngressRoute({
    name: "management",
    namespace,

    domain: managementDomain,

    serviceName: "management",
    servicePort: 8080,

    tlsPassthrough: true,
  })
}

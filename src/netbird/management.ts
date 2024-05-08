import { createConfigMap, createPersistentVolumeClaim } from "../common"
import { all } from "@pulumi/pulumi"
import { createStatefulService } from "../common/stateful-service"
import {
  authClientId,
  authClientSecret,
  authZitadelUrl,
  dnsDomain,
  domain,
  encryptionKey,
  namespace,
  turnPassword,
} from "./shared"

const managementConfigMap = createConfigMap({
  name: "management-config",
  namespace,

  key: "management.json",
  value: all([turnPassword, encryptionKey, authClientSecret]).apply(
    ([turnPassword, encryptionKey, authClientSecret]) => {
      return JSON.stringify({
        Stuns: [
          {
            Proto: "udp",
            URI: `stun:${domain}:3478`,
            Username: "",
            Password: null,
          },
        ],
        TURNConfig: {
          Turns: [
            {
              Proto: "udp",
              URI: `turn:${domain}:3478`,
              Username: "self",
              Password: turnPassword,
            },
          ],
          CredentialsTTL: "12h",
          Secret: "secret",
          TimeBasedCredentials: false,
        },
        Signal: {
          Proto: "https",
          URI: `${domain}:443`,
          Username: "",
          Password: null,
        },
        ReverseProxy: {
          TrustedHTTPProxies: [],
          TrustedHTTPProxiesCount: 0,
          TrustedPeers: ["0.0.0.0/0"],
        },
        Datadir: "",
        DataStoreEncryptionKey: encryptionKey,
        StoreConfig: {
          Engine: "sqlite",
        },
        HttpConfig: {
          Address: `0.0.0.0:8080`,
          AuthIssuer: authZitadelUrl,
          AuthAudience: authClientId,
          // AuthKeysLocation: "$NETBIRD_AUTH_JWT_CERTS",
          // AuthUserIDClaim: "$NETBIRD_AUTH_USER_ID_CLAIM",
          // CertFile: "$NETBIRD_MGMT_API_CERT_FILE",
          // CertKey: "$NETBIRD_MGMT_API_CERT_KEY_FILE",
          IdpSignKeyRefreshEnabled: false,
          OIDCConfigEndpoint: `${authZitadelUrl}/.well-known/openid-configuration`,
        },
        IdpManagerConfig: {
          ManagerType: "zitadel",
          ClientConfig: {
            Issuer: authZitadelUrl,
            TokenEndpoint: `${authZitadelUrl}/oauth/v2/token`,
            ClientID: "netbird",
            ClientSecret: authClientSecret,
            GrantType: "client_credentials",
          },
          ExtraConfig: {
            ManagementEndpoint: `${authZitadelUrl}/management/v1`,
          },
        },
        DeviceAuthorizationFlow: {
          Provider: "hosted",
          ProviderConfig: {
            Audience: authClientId,
            ClientID: authClientId,
            ClientSecret: "",
            TokenEndpoint: `${authZitadelUrl}/oauth/v2/token`,
            DeviceAuthEndpoint: `${authZitadelUrl}/oauth/v2/device_authorization`,
            Scope: "openid email",
            UseIDToken: false,
            RedirectURLs: null,
          },
        },
        // PKCEAuthorizationFlow: {
        //   ProviderConfig: {
        //     Audience: authClientId,
        //     ClientID: authClientId,
        //     ClientSecret: authClientSecret,
        //     // Domain: "",
        //     AuthorizationEndpoint: `${authZitadelUrl}/oauth/v2/authorize`,
        //     TokenEndpoint: `${authZitadelUrl}/oauth/v2/token`,
        //     Scope: "openid profile email offline_access api",
        //     // RedirectURLs: [$NETBIRD_AUTH_PKCE_REDIRECT_URLS],
        //     UseIDToken: false,
        //   },
        // },
      })
    },
  ),
})

const managementDataVolumeClaim = createPersistentVolumeClaim({
  name: "management-data",
  namespace,
  capacity: "1Gi",
})

export const management = createStatefulService({
  name: "management",
  namespace,

  image: "netbirdio/management",

  args: [
    "--port=8080",
    "--log-file=console",
    "--log-level=info",
    "--disable-anonymous-metrics=true",
    `--single-account-mode-domain=${domain}`,
    `--dns-domain=${dnsDomain}`,
  ],

  volumes: [
    {
      name: "config",
      configMap: {
        name: managementConfigMap.metadata.name,
        items: [{ key: "management.json", path: "management.json" }],
      },
    },
    {
      name: "data",
      persistentVolumeClaim: {
        claimName: managementDataVolumeClaim.metadata.name,
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
  ],

  ports: [{ name: "management", port: 8080 }],
})

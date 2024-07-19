import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ApplicationOptions {
  /**
   * The options to configure the service.
   */
  service?: k8s.ChildComponentOptions<k8s.ServiceOptions>

  /**
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>

  /**
   * The options for init containers.
   */
  initContainers?: pulumi.Input<k8s.raw.types.input.core.v1.Container[]>

  /**
   * The options for extra volumes.
   */
  volumes?: pulumi.Input<k8s.raw.types.input.core.v1.Volume[]>

  /**
   * The secret containing the database configuration.
   */
  databaseSecret: pulumi.Input<k8s.raw.core.v1.Secret>

  /**
   * The fully qualified domain name of the application.
   */
  domain: pulumi.Input<string>

  /**
   * The base domain of the VPN.
   */
  vpnDomain: pulumi.Input<string>

  /**
   * The private key for the noise protocol.
   * If not provided, a new key will be generated and placed in the volume.
   */
  noisePrivateKey?: pulumi.Input<string>

  /**
   * The private key for the DERP server.
   * If not provided, a new key will be generated and placed in the volume.
   */
  derpServerPrivateKey?: pulumi.Input<string>

  /**
   * The public IPv4 address of the instance.
   */
  publicIpV4: pulumi.Input<string>

  /**
   * The public IPv6 address of the instance.
   */
  publicIpV6: pulumi.Input<string>

  /**
   * The ACL to use for the application.
   */
  acl: pulumi.Input<Record<string, unknown>>

  /**
   * The configuration for OIDC authentication.
   */
  oidc?: pulumi.Input<OidcConfig>
}

export interface OidcConfig {
  /**
   * The issuer URL of the OIDC provider.
   */
  issuer: pulumi.Input<string>

  /**
   * The client ID of the OIDC provider.
   */
  clientId: pulumi.Input<string>

  /**
   * The client secret of the OIDC provider.
   */
  clientSecret: pulumi.Input<string>
}

export interface Application extends k8s.Application {
  /**
   * The workload service that powers the application.
   */
  workloadService: k8s.WorkloadService<"Deployment">

  /**
   * The ingress which exposes the application.
   */
  ingress?: k8s.raw.networking.v1.Ingress
}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The application.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "headscale"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const noisePrivateKeySecret =
    options.noisePrivateKey &&
    k8s.createSecret({
      name: k8s.getPrefixedName("noise-private-key", fullName),
      namespace,

      realName: "noise-private-key",

      key: "noise_private.key",
      value: options.noisePrivateKey,
    })

  const derpServerPrivateKeySecret =
    options.derpServerPrivateKey &&
    k8s.createSecret({
      name: k8s.getPrefixedName("derp-server-private-key", fullName),
      namespace,

      realName: "derp-server-private-key",

      key: "derp_server_private.key",
      value: options.derpServerPrivateKey,
    })

  const aclConfigMap = k8s.createConfigMap({
    name: k8s.getPrefixedName("acl", fullName),
    namespace,

    realName: "acl",

    key: "acl.json",
    value: pulumi.output(options.acl).apply(JSON.stringify),
  })

  const configSecret = k8s.createSecret({
    name: k8s.getPrefixedName("config", fullName),
    namespace,

    realName: "config",

    key: "config.yaml",
    value: pulumi
      .output({
        server_url: `https://${options.domain}`,
        listen_addr: "0.0.0.0:8080",
        metrics_listen_addr: "127.0.0.1:9090",
        grpc_listen_addr: "127.0.0.1:50443",
        grpc_allow_insecure: false,
        noise: {
          private_key_path: "/var/lib/headscale/noise_private.key",
        },
        prefixes: {
          v6: "fd7a:115c:a1e0::/48",
          v4: "100.64.0.0/10",
          allocation: "sequential",
        },
        derp: {
          server: {
            enabled: true,
            region_id: 999,
            region_code: "headscale",
            region_name: "Headscale Embedded DERP",
            stun_listen_addr: "0.0.0.0:3478",
            private_key_path: "/var/lib/headscale/derp_server_private.key",
            automatically_add_embedded_derp_region: true,
            ipv4: options.publicIpV4,
            ipv6: options.publicIpV6,
          },
          urls: [],
          paths: [],
          auto_update_enabled: false,
          update_frequency: "24h",
        },
        disable_check_updates: false,
        ephemeral_node_inactivity_timeout: "30m",

        oidc: pulumi.output(options.oidc).apply(oidc =>
          oidc
            ? {
                issuer: oidc.issuer,
                client_id: oidc.clientId,
                client_secret: oidc.clientSecret,
                strip_email_domain: true,
              }
            : undefined,
        ),

        database: {
          type: "postgres",
          postgres: {
            host: pulumi.output(options.databaseSecret).stringData.host,
            port: pulumi.output(options.databaseSecret).stringData.port,
            name: pulumi.output(options.databaseSecret).stringData.database,
            user: pulumi.output(options.databaseSecret).stringData.username,
            pass: pulumi.output(options.databaseSecret).stringData.password,
            max_open_conns: 10,
            max_idle_conns: 10,
            conn_max_idle_time_secs: 3600,
          },
        },

        log: {
          format: "text",
          level: "info",
        },

        acl_policy_path: "/var/lib/headscale/acl.json",
        dns_config: {
          override_local_dns: true,
          nameservers: ["1.1.1.1"],
          domains: [],
          magic_dns: true,
          base_domain: options.vpnDomain,
        },
        unix_socket: "/var/run/headscale/headscale.sock",
        unix_socket_permission: "0770",
        logtail: {
          enabled: false,
        },
        randomize_client_port: false,
      })
      .apply(JSON.stringify),
  })

  const secretsVolume =
    !options.noisePrivateKey || !options.derpServerPrivateKey
      ? k8s.createPersistentVolumeClaim({
          name: k8s.getPrefixedName("secrets", fullName),
          namespace,

          realName: "secrets",
          capacity: "1Mi",
        })
      : undefined

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "Deployment",
    realName: "headscale",

    container: {
      image: "headscale/headscale:0.23.0-alpha12",
      args: ["serve"],

      volumeMounts: [
        {
          name: aclConfigMap.metadata.name,
          mountPath: "/var/lib/headscale/acl.json",
          subPath: "acl.json",
        },
        {
          name: configSecret.metadata.name,
          mountPath: "/etc/headscale/config.yaml",
          subPath: "config.yaml",
        },

        ...(secretsVolume
          ? [
              {
                name: secretsVolume.metadata.name,
                mountPath: "/var/lib/headscale",
              },
            ]
          : []),

        ...(noisePrivateKeySecret
          ? [
              {
                name: noisePrivateKeySecret.metadata.name,
                mountPath: "/var/lib/headscale/noise_private.key",
                subPath: "noise_private.key",
              },
            ]
          : []),

        ...(derpServerPrivateKeySecret
          ? [
              {
                name: derpServerPrivateKeySecret.metadata.name,
                mountPath: "/var/lib/headscale/derp_server_private.key",
                subPath: "derp_server_private.key",
              },
            ]
          : []),
      ],
    },

    service: options.service,
    initContainers: options.initContainers,
    nodeSelector: options.nodeSelector,

    ports: [
      { name: "http", port: 8080 },
      { name: "stun", port: 3478 },
    ],

    volumes: pulumi
      .output(options.volumes)
      .apply(volumes => [
        aclConfigMap,
        configSecret,
        ...(volumes ?? []),
        ...(secretsVolume ? [secretsVolume] : []),
        ...(noisePrivateKeySecret ? [noisePrivateKeySecret] : []),
        ...(derpServerPrivateKeySecret ? [derpServerPrivateKeySecret] : []),
      ]),
  })

  const ingress =
    options.ingress &&
    k8s.createIngress({
      name: fullName,
      namespace,

      ...options.ingress,

      rule: {
        ...options.ingress.rule,
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: workloadService.service.metadata.name,
                  port: { name: "http" },
                },
              },
            },
          ],
        },
      },
    })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    workloadService,
    ingress,
  }
}

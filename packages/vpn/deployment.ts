import { pulumi, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface LocationConfig {
  name: string
  endpoint: string
  publicKey: string
}

export interface DeploymentOptions {
  /**
   * The namespace where the upstream secret will be created.
   */
  namespace: k8s.raw.core.v1.Namespace

  /**
   * The private key used to authenticate with the upstream server.
   */
  privateKey: pulumi.Input<string>

  /**
   * The address of the local interface.
   */
  address: pulumi.Input<string>

  /**
   * The address of the DNS server to use.
   */
  dnsServerAddress: pulumi.Input<string>

  /**
   * The location of the upstream server.
   */
  location: LocationConfig

  /**
   * The node selector to use for the deployment.
   */
  nodeSelector: k8s.NodeSelector

  /**
   * The name of the frontend interface.
   * All packets from the frontend interface will be forwarded to the upstream server.
   */
  frontendInterface: string

  /**
   * The container that will be used to create and manage the frontend interface.
   */
  frontendContainer: k8s.ContainerOptions

  /**
   * Extra volumes to define in the deployment.
   */
  volumes?: k8s.raw.types.input.core.v1.Volume[]
}

export interface Deployment {
  /**
   * The workload that was created.
   */
  workload: k8s.raw.types.input.apps.v1.Deployment

  /**
   * The secret that was created.
   */
  secret: k8s.raw.types.input.core.v1.Secret
}

export function createDeployment(options: DeploymentOptions): Deployment {
  const secret = k8s.createSecret({
    name: `vpn-${options.location.name}-config`,
    namespace: options.namespace,

    key: "wg0.conf",
    value: pulumi.interpolate`
      [Interface]
      Address = ${options.address}
      PrivateKey = ${options.privateKey}
      DNS = ${options.dnsServerAddress}

      PostUp = iptables -t mangle -A PREROUTING -i ${options.frontendInterface} -j MARK --set-mark 0x1
      PostUp = ip rule del not from all fwmark 0xca6c lookup 51820
      PostUp = ip rule add from all fwmark 0x1 lookup 51820
      PostUp = iptables -t nat -A POSTROUTING -o wg0 -j MASQUERADE
      PostUp = ip route add ${options.dnsServerAddress} dev wg0

      [Peer]
      PublicKey = ${options.location.publicKey}
      Endpoint = ${options.location.endpoint}
      AllowedIPs = 0.0.0.0/0
      PersistentKeepalive = 25
    `.apply(trimIndentation),
  })

  const workload = k8s.createWorkload({
    name: `vpn-${options.location.name}`,
    namespace: options.namespace,

    kind: "Deployment",

    nodeSelector: options.nodeSelector,

    deploymentStrategy: {
      type: "Recreate", // to prevent conflicts with some frontend containers like tailscale
    },

    containers: [
      // Frontend
      options.frontendContainer,

      // Upstream WireGuard
      {
        name: "upstream",
        image: "linuxserver/wireguard:latest",

        volumeMounts: [
          {
            name: "wg0",
            mountPath: "/config/wg_confs",
          },
        ],

        environment: {
          PUID: "1000",
          PGID: "1000",
          TZ: "Etc/UTC",
        },

        securityContext: {
          capabilities: {
            add: ["NET_ADMIN"],
          },
        },
      },
    ],

    volumes: [
      ...(options.volumes ?? []),
      {
        name: "wg0",
        secret: {
          secretName: secret.metadata.name,
          items: [{ key: "wg0.conf", path: "wg0.conf" }],
        },
      },
    ],

    securityContext: {
      sysctls: [
        {
          name: "net.ipv4.conf.all.src_valid_mark",
          value: "1",
        },
        {
          name: "net.ipv4.ip_forward",
          value: "1",
        },
        {
          name: "net.ipv6.conf.all.forwarding",
          value: "1",
        },
      ],
    },
  })

  return { workload, secret }
}

import { pulumi, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"
import { mapHostnameToNodeSelector } from "@infra/k8s/options"
import { tailscale } from "@infra/tailscale"

interface LocationConfig {
  name: string
  endpoint: string
  publicKey: string
}

const config = new pulumi.Config("vpn")

const address = config.require("address")
const locations = config.getObject<LocationConfig[]>("locations") ?? []
const privateKey = config.requireSecret("privateKey")
const tailscaleAuthKey = config.requireSecret("tailscaleAuthKey")
const node = config.require("node")

const namespace = k8s.createNamespace({ name: "vpn" })

tailscale.createAuthSecret({
  name: "vpn-tailscale-auth",
  namespace,
  value: tailscaleAuthKey,
})

for (const location of locations) {
  const secret = k8s.createSecret({
    name: `vpn-${location.name}-config`,
    namespace,

    key: "wg0.conf",
    value: privateKey.apply(privateKey => {
      return trimIndentation(`
        [Interface]
        Address = ${address}
        PrivateKey = ${privateKey}

        PostUp = iptables -t mangle -A PREROUTING -i tailscale0 -j MARK --set-mark 0x1
        PostUp = ip rule del not from all fwmark 0xca6c lookup 51820
        PostUp = ip rule add from all fwmark 0x1 lookup 51820
        PostUp = iptables -t nat -A POSTROUTING -o wg0 -j MASQUERADE

        [Peer]
        PublicKey = ${location.publicKey}
        Endpoint = ${location.endpoint}
        AllowedIPs = 0.0.0.0/0
        PersistentKeepalive = 25
      `)
    }),
  })

  const stateVolumeClaim = k8s.createPersistentVolumeClaim({
    name: `vpn-${location.name}-state`,
    namespace,

    capacity: "10Mi",
  })

  k8s.createWorkload({
    name: `vpn-${location.name}`,
    namespace,

    kind: "Deployment",

    nodeSelector: mapHostnameToNodeSelector(node),

    containers: [
      // Tailscale Frontend
      {
        name: "tailscale",
        image: "ghcr.io/tailscale/tailscale:latest",

        env: [
          {
            name: "TS_AUTHKEY",
            valueFrom: {
              secretKeyRef: {
                name: "tailscale-auth",
                key: "authKey",
              },
            },
          },
          {
            name: "TS_USERSPACE",
            value: "false",
          },
          {
            name: "TS_HOSTNAME",
            value: location.name,
          },
          {
            name: "TS_KUBE_SECRET",
            value: "",
          },
          {
            name: "TS_STATE_DIR",
            value: "/var/lib/tailscale",
          },
          {
            name: "TS_EXTRA_ARGS",
            value: "--advertise-exit-node",
          },
        ],

        volumeMounts: [
          {
            name: stateVolumeClaim.metadata.name,
            mountPath: "/var/lib/tailscale",
          },
        ],

        securityContext: {
          capabilities: {
            add: ["NET_ADMIN"],
          },
        },
      },

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
      stateVolumeClaim,
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
      ],
    },
  })
}

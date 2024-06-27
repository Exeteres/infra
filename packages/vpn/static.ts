import { pulumi, trimIndentation } from "@infra/core"
import { Deployment, DeploymentOptions, createDeployment } from "./deployment"
import { k8s } from "@infra/k8s"

export interface StaticClientConfig {
  /**
   * The public key of the client.
   */
  publicKey: pulumi.Input<string>

  /**
   * The address to assign to the client.
   */
  address: pulumi.Input<string>
}

export type StaticDeploymentOptions = Omit<DeploymentOptions, "frontendInterface" | "frontendContainer" | "volumes"> & {
  /**
   * The private key to use for the frontend container.
   */
  frontendPrivateKey: pulumi.Input<string>

  /**
   * The address to assign to the frontend container.
   */
  frontendAddress: pulumi.Input<string>

  /**
   * The port where the frontend container will listen for incoming connections.
   */
  frontendPort: pulumi.Input<number>

  /**
   * The keys to authenticate frontend clients with.
   */
  clients: pulumi.Input<StaticClientConfig[]>
}

export interface StaticDeployment extends Deployment {
  /**
   * The sercice that exposes the frontend container.
   */
  service: k8s.raw.core.v1.Service
}

export function createStaticDeployment(options: StaticDeploymentOptions): StaticDeployment {
  const secret = k8s.createSecret({
    name: `vpn-${options.location.name}-frontend-config`,
    namespace: options.namespace,

    key: "wg1.conf",
    value: pulumi
      .all([options.frontendAddress, options.frontendPrivateKey, options.clients, options.frontendPort])
      .apply(([address, privateKey, clients, frontendPort]) => {
        const peerSections = clients.map(client => {
          return trimIndentation(`
            [Peer]
            PublicKey = ${client.publicKey}
            AllowedIPs = ${client.address}
          `)
        })

        return trimIndentation(`
          [Interface]
          Address = ${address}
          PrivateKey = ${privateKey}
          ListenPort = ${frontendPort}

          ${peerSections.join("\n\n")}
        `)
      }),
  })

  const service = k8s.createService({
    name: `vpn-${options.location.name}-frontend`,
    namespace: options.namespace,

    ports: [
      {
        name: "wireguard",
        port: options.frontendPort,
        protocol: "UDP",
        nodePort: options.frontendPort,
      },
    ],

    selector: {
      "app.kubernetes.io/name": `vpn-${options.location.name}`,
    },

    type: "NodePort",
  })

  const deployment = createDeployment({
    ...options,

    frontendInterface: "wg1",

    volumes: [
      {
        name: secret.metadata.name,
        secret: {
          secretName: secret.metadata.name,
        },
      },
    ],

    frontendContainer: {
      name: "frontend",
      image: "linuxserver/wireguard:latest",

      volumeMounts: [
        {
          name: secret.metadata.name,
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

      ports: [
        {
          containerPort: options.frontendPort,
          protocol: "UDP",
        },
      ],
    },
  })

  return {
    ...deployment,
    service,
  }
}

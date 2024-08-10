import { InputArray, pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ContainerSpecOptions {
  /**
   * The name of the secret to store the auth key and session data.
   */
  secretName: string

  /**
   * The name of the host to register with Tailscale.
   */
  hostname: pulumi.Input<string>

  /**
   * The namespace where the container will be used.
   */
  namespace: k8s.raw.core.v1.Namespace

  /**
   * The tailscale auth key.
   */
  authKey: pulumi.Input<string>

  /**
   * Whether to advertise the exit node.
   */
  advertiseExitNode?: pulumi.Input<boolean>

  /**
   * The routes to advertise.
   */
  advertiseRoutes?: InputArray<string[]>

  /**
   * The JSON-serialized content of the auth secret (the content of the `data`).
   * If not provided, the secret will be created with the `authKey` and populated in the first run.
   */
  authState?: pulumi.Input<string | undefined>
}

export interface Container {
  /**
   * The container spec to be used in a pod.
   */
  container: k8s.ContainerOptions

  /**
   * The created service account which has access to the secret.
   */
  serviceAccount: k8s.raw.core.v1.ServiceAccount
}

export function createContainer(options: ContainerSpecOptions): Container {
  const secret = pulumi.output(options.authState).apply(authState => {
    if (authState) {
      return k8s.createSecret({
        name: options.secretName,
        namespace: options.namespace,

        rawData: JSON.parse(authState),
      })
    }

    return k8s.createSecret({
      name: options.secretName,
      namespace: options.namespace,

      key: "authkey",
      value: options.authKey,
    })
  })

  const { role } = k8s.createRole({
    name: options.secretName,
    namespace: options.namespace,

    rule: {
      apiGroups: [""],
      resources: ["secrets"],
      resourceNames: [secret.metadata.name],
      verbs: ["get", "update", "patch"],
    },
  })

  const { serviceAccount } = k8s.createServiceAccount({
    name: options.secretName,
    namespace: options.namespace,

    role: role,
  })

  const extraArgs = pulumi.all([options.advertiseRoutes, options.advertiseExitNode]).apply(([routes, exitNode]) => {
    const args: string[] = []

    if (routes) {
      args.push(`--advertise-routes=${routes.join(",")}`)
    }

    if (exitNode) {
      args.push("--advertise-exit-node")
    }

    if (args.length === 0) {
      return undefined
    }

    return args.join(" ")
  })

  return {
    container: {
      name: "tailscale",
      image: "ghcr.io/tailscale/tailscale:latest",

      environment: {
        TS_AUTH_ONCE: "true",
        TS_USERSPACE: "false",
        TS_HOSTNAME: options.hostname,
        TS_KUBE_SECRET: secret.metadata.name,
        TS_EXTRA_ARGS: extraArgs,
      },

      securityContext: {
        capabilities: {
          add: ["NET_ADMIN"],
        },
      },
    },

    serviceAccount,
  }
}

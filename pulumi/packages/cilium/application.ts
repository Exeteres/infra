import { command, Input, merge } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The IP address of the Kubernetes API server.
   */
  k8sServiceHost: Input<string>

  /**
   * The name of the Kubernetes context to use.
   */
  k8sContext: string
}

export interface Application extends k8s.ReleaseApplication {}

export function createApplication(options: ApplicationOptions): Application {
  const namespace = options.namespace ?? k8s.raw.core.v1.Namespace.get("kube-system", "kube-system")

  const release = k8s.createHelmRelease({
    name: "cilium",
    namespace,

    chart: "cilium",
    repo: "https://helm.cilium.io",
    version: "1.16.1",

    ...options.release,

    values: merge(
      {
        policyEnforcementMode: "always",
        k8sServiceHost: options.k8sServiceHost,
        k8sServicePort: 6443,
        operator: {
          replicas: 1,
        },
        hubble: {
          relay: {
            enabled: true,
          },
          ui: {
            enabled: true,
          },
        },
      },
      options.release?.values ?? {},
    ),
  })

  command.createCommand({
    name: "recreate-pods",
    parent: namespace,
    dependsOn: release,

    triggers: [release],

    create: [
      "kubectl get pods --all-namespaces",
      "-o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,HOSTNETWORK:.spec.hostNetwork",
      "--no-headers=true",
      `--context=${options.k8sContext}`,
      "| grep '<none>'",
      `| awk '{print "-n "$1" "$2}'`,
      "| xargs -L 1 -r kubectl delete pod",
      `--context=${options.k8sContext}`,
    ],
  })

  return {
    namespace,
    release,
  }
}

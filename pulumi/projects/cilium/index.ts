import { cilium } from "@infra/cilium"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { getSharedEnvironment } from "@projects/common"

const { internalIp } = getSharedEnvironment()

const kubeSystemNamespace = k8s.raw.core.v1.Namespace.get("kube-system", "kube-system")

cilium.createApplication({
  namespace: kubeSystemNamespace,
  k8sServiceHost: internalIp,
  k8sContext: pulumi.getStack(),
})

cilium.createAllowAllForNamespacePolicy({
  name: "allow-all-for-kube-system",
  namespace: kubeSystemNamespace,
})

cilium.createPolicy({
  name: "allow-kube-dns",
  isClusterwide: true,

  description: "Allow DNS queries to kube-dns from all pods in the cluster",

  endpointSelector: {
    matchExpressions: [
      {
        operator: "NotIn",
        key: "k8s:io.kubernetes.pod.namespace",
        values: ["kube-system"],
      },
      {
        operator: "NotIn",
        key: "k8s:k8s-app",
        values: ["kube-dns"],
      },
    ],
  },

  egress: {
    toEndpoint: {
      "k8s:io.kubernetes.pod.namespace": "kube-system",
      "k8s:k8s-app": "kube-dns",
    },
    toPort: {
      port: 53,
      protocol: "UDP",

      // Enable L7 visibility
      rules: {
        dns: [{ matchPattern: "*" }],
      },
    },
  },
})

cilium.createPolicy({
  name: "allow-health-checks",
  isClusterwide: true,

  description: "Allow health checks to all pods in the cluster",

  endpointSelector: {
    "reserved:health": "",
  },

  ingress: {
    fromEntity: "remote-node",
  },

  egress: {
    toEntity: "remote-node",
  },
})

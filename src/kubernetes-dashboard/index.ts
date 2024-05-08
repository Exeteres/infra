import { createHelmRelease, createNamespace, nodes } from "../common"
import * as k8s from "@pulumi/kubernetes"

const { namespace } = createNamespace({ name: "kubernetes-dashboard" })

const release = createHelmRelease({
  name: "kubernetes-dashboard",
  namespace,

  chart: "kubernetes-dashboard",
  repo: "https://kubernetes.github.io/dashboard/",

  values: {
    app: {
      scheduling: {
        nodeSelector: nodes.master.nodeSelector,
      },
    },

    kong: {
      nodeSelector: nodes.master.nodeSelector,
    },
  },
})

const serviceAccount = new k8s.core.v1.ServiceAccount(
  "dashboard-user",
  {
    metadata: {
      name: "dashboard-user",
      namespace: namespace.metadata.name,
    },
  },
  { parent: namespace, dependsOn: release },
)

void new k8s.rbac.v1.ClusterRoleBinding(
  "dashboard-user",
  {
    metadata: {
      name: "dashboard-user",
      namespace: namespace.metadata.name,
    },
    roleRef: {
      apiGroup: "rbac.authorization.k8s.io",
      kind: "ClusterRole",
      name: "cluster-admin",
    },
    subjects: [
      {
        kind: "ServiceAccount",
        name: serviceAccount.metadata.name,
        namespace: namespace.metadata.name,
      },
    ],
  },
  { parent: namespace, dependsOn: serviceAccount },
)

// Allow only access inside namespace
void new k8s.networking.v1.NetworkPolicy(
  "allow-same-namespace",
  {
    metadata: {
      name: "allow-same-namespace",
      namespace: namespace.metadata.name,
    },
    spec: {
      podSelector: {},
      policyTypes: ["Ingress"],
      ingress: [
        {
          from: [
            {
              podSelector: {},
            },
          ],
        },
      ],
    },
  },
  { parent: namespace, dependsOn: release },
)

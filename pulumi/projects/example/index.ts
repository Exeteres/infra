// import * as k8s from "@pulumi/kubernetes"
import { k8s } from "@infra/k8s"
import { certManager } from "@infra/cert-manager"

// const namespace = new k8s.core.v1.Namespace("example")

// new k8s.apps.v1.Deployment("nginx", {
//   metadata: {
//     name: "nginx",
//     namespace: namespace.metadata.name,
//   },
//   spec: {
//     selector: {
//       matchLabels: {
//         app: "nginx",
//       },
//     },
//     replicas: 1,
//     template: {
//       metadata: {
//         labels: {
//           app: "nginx",
//         },
//       },
//       spec: {
//         containers: [
//           {
//             name: "nginx",
//             image: "nginx",
//           },
//         ],
//       },
//     },
//   },
// })

const namespace = k8s.createNamespace({ name: "example" })

const { service } = k8s.createWorkloadService({
  name: "nginx",
  namespace,
  kind: "Deployment",

  port: 80,

  container: {
    image: "nginx",
  },
})

// Создание ConfigMap с одним ключом и значением
const configMap = k8s.createConfigMap({
  name: "example",
  namespace,

  key: "example",
  value: "example",
})

// Создание Helm-релиза указанной версии
const helmRelease = k8s.createHelmRelease({
  name: "example",
  namespace,

  chart: "nginx-ingress",
  repo: "https://kubernetes.github.io/ingress-nginx",
  version: "1.41.3",

  values: {
    controller: {
      service: {
        type: "LoadBalancer",
      },
    },
  },
})

// Создание сервисного аккаунта, роли и биндинга
const { serviceAccount } = k8s.createServiceAccount({
  name: "example",
  namespace,
})

const { role, binding } = k8s.createRole({
  name: "example",
  namespace,

  subject: serviceAccount,

  rule: {
    apiGroups: [""],
    resources: ["pods"],
    verbs: ["get", "list"],
  },
})

// Создание issuer и certificate через cert-manager
const issuer = certManager.createPlainIssuer({
  name: "example",
  namespace,
})

const certificate = certManager.createCertificate({
  name: "example",
  namespace,

  issuer,
  domain: "example.com",
})

// Создание pvc
const pvc = k8s.createPersistentVolumeClaim({
  name: "example",
  namespace,

  capacity: "1Gi",
})

// Создание сервиса с использованием созданных ресурсов
const { service } = k8s.createWorkloadService({
  name: "example",
  namespace,
  kind: "Deployment",

  port: 80,
  volumes: [pvc, configMap],
  serv

  container: {
    image: "my-image",

    volumeMounts: [
      {
        volume: pvc,
        mountPath: "/data",
      },
      {
        volume: configMap,
        mountPath: "/config",
      },
    ],
  },
})

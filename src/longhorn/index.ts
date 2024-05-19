import { createHelmRelease, createNamespace, createSecret, k8s, storageClasses } from "../common"

export const { namespace, config } = createNamespace({ name: "longhorn-system" })

const release = createHelmRelease({
  name: "longhorn",
  namespace,

  chart: "longhorn",
  repo: "https://charts.longhorn.io",

  values: {
    persistence: {
      defaultClass: false,
    },
  },
})

const encryptionKeySecret = createSecret({
  name: "longhorn-encryption-key",
  namespace,

  data: {
    CRYPTO_KEY_VALUE: config.requireSecret("encryption-key"),
    CRYPTO_KEY_PROVIDER: "secret",
  },
})

void new k8s.storage.v1.StorageClass(
  storageClasses.encrypted,
  {
    metadata: {
      name: storageClasses.encrypted,
    },
    provisioner: "driver.longhorn.io",
    allowVolumeExpansion: true,
    parameters: {
      numberOfReplicas: "3",
      staleReplicaTimeout: "2880",
      fromBackup: "",
      encrypted: "true",
      dataLocality: "best-effort",

      "csi.storage.k8s.io/provisioner-secret-name": encryptionKeySecret.metadata.name,
      "csi.storage.k8s.io/provisioner-secret-namespace": encryptionKeySecret.metadata.namespace,
      "csi.storage.k8s.io/node-publish-secret-name": encryptionKeySecret.metadata.name,
      "csi.storage.k8s.io/node-publish-secret-namespace": encryptionKeySecret.metadata.namespace,
      "csi.storage.k8s.io/node-stage-secret-name": encryptionKeySecret.metadata.name,
      "csi.storage.k8s.io/node-stage-secret-namespace": encryptionKeySecret.metadata.namespace,
    },
  },
  { parent: namespace, dependsOn: [release, encryptionKeySecret] },
)

void new k8s.storage.v1.StorageClass(
  storageClasses.encryptedLocal,
  {
    metadata: {
      name: storageClasses.encryptedLocal,
    },
    provisioner: "driver.longhorn.io",
    allowVolumeExpansion: true,
    parameters: {
      numberOfReplicas: "1",
      staleReplicaTimeout: "2880",
      fromBackup: "",
      encrypted: "true",
      dataLocality: "strict-local",

      "csi.storage.k8s.io/provisioner-secret-name": encryptionKeySecret.metadata.name,
      "csi.storage.k8s.io/provisioner-secret-namespace": encryptionKeySecret.metadata.namespace,
      "csi.storage.k8s.io/node-publish-secret-name": encryptionKeySecret.metadata.name,
      "csi.storage.k8s.io/node-publish-secret-namespace": encryptionKeySecret.metadata.namespace,
      "csi.storage.k8s.io/node-stage-secret-name": encryptionKeySecret.metadata.name,
      "csi.storage.k8s.io/node-stage-secret-namespace": encryptionKeySecret.metadata.namespace,
    },
  },
  { parent: namespace, dependsOn: [release, encryptionKeySecret] },
)

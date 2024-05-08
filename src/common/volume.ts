import * as k8s from "@pulumi/kubernetes"
import { storageClasses } from "./data"

interface PersistentVolumeOptions {
  name: string
  namespace: k8s.core.v1.Namespace
  capacity: string
}

export const createPersistentVolumeClaim = ({ name, namespace, capacity }: PersistentVolumeOptions) => {
  const claim = new k8s.core.v1.PersistentVolumeClaim(
    name,
    {
      metadata: {
        name: name,
        namespace: namespace.metadata.name,
        annotations: {
          "pulumi.com/skipAwait": "true",
        },
      },
      spec: {
        accessModes: ["ReadWriteOnce"],
        resources: { requests: { storage: capacity } },
        storageClassName: storageClasses.encrypted,
      },
    },
    { parent: namespace },
  )

  return claim
}

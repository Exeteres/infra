import { mapEnvironment } from "./utils"
import { Input } from "@pulumi/pulumi"
import * as k8s from "@pulumi/kubernetes"

interface ServiceOptions {
  name: string
  namespace: k8s.core.v1.Namespace
  image: string
  args?: string[]
  ports?: Input<k8s.types.input.core.v1.ServicePort[]>
  probePath?: string
  replicas?: number
  environment?: Record<string, Input<string | k8s.types.input.core.v1.EnvVarSource>>
  volumes?: Input<k8s.types.input.core.v1.Volume[]>
  volumeMounts?: Input<k8s.types.input.core.v1.VolumeMount[]>
}

export const createReplicaService = ({
  name,
  namespace,
  image,
  replicas,
  ports,
  environment,
  args,
  volumeMounts,
  volumes,
}: ServiceOptions) => {
  const appLabels = { app: name }

  const service = new k8s.core.v1.Service(
    name,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
        labels: appLabels,
      },
      spec: {
        ports,
        selector: appLabels,
        type: "ClusterIP",
      },
    },
    { parent: namespace },
  )

  void new k8s.apps.v1.ReplicaSet(
    name,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
        labels: appLabels,
      },
      spec: {
        selector: { matchLabels: appLabels },
        replicas: replicas ?? 1,
        template: {
          metadata: {
            namespace: namespace.metadata.name,
            labels: appLabels,
          },
          spec: {
            containers: [
              {
                name,
                image,
                args,
                env: mapEnvironment(environment),
                imagePullPolicy: "IfNotPresent",
                volumeMounts,
              },
            ],
            volumes,
          },
        },
      },
    },
    { parent: namespace },
  )

  return service
}

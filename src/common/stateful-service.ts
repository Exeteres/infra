import { Input } from "@pulumi/pulumi"
import * as k8s from "@pulumi/kubernetes"
import { mapEnvironment } from "./utils"

interface StatefulServiceOptions {
  name: string
  namespace: k8s.core.v1.Namespace
  image: string
  ports?: k8s.types.input.core.v1.ServicePort[]
  args?: string[]
  environment?: Record<string, Input<string | k8s.types.input.core.v1.EnvVarSource>>
  volumes?: k8s.types.input.core.v1.Volume[]
  volumeMounts?: k8s.types.input.core.v1.VolumeMount[]
}

export const createStatefulService = ({
  name,
  namespace,
  image,
  environment,
  args,
  volumeMounts,
  volumes,
  ports,
}: StatefulServiceOptions) => {
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

  void new k8s.apps.v1.StatefulSet(
    name,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
        labels: appLabels,
      },
      spec: {
        serviceName: name,
        replicas: 1,
        selector: { matchLabels: appLabels },
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

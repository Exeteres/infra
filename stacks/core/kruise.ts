import { createKruiseRelease } from "@infra/kruise"
import { createNamespace } from "@infra/k8s"

const namespace = createNamespace({ name: "kruise-system" })

export const kruiseRelease = createKruiseRelease({
  name: "kruise",
  namespace,

  values: {
    daemon: {
      socketLocation: "/var/run/k3s/containerd",
    },
  },
})

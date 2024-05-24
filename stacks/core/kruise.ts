import { createKruiseRelease, createNamespace } from "@infra/core"

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

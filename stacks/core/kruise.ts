import { kruise } from "@infra/kruise"

kruise.createApplication({
  releaseOptions: {
    values: {
      daemon: {
        socketLocation: "/var/run/k3s/containerd",
      },
    },
  },
})

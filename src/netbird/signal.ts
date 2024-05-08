import { createPersistentVolumeClaim, createStatefulService } from "../common"
import { namespace } from "./shared"

const signalDataVolumeClaim = createPersistentVolumeClaim({
  name: "signal-data",
  namespace,
  capacity: "1Gi",
})

export const signal = createStatefulService({
  name: "signal",
  namespace,

  image: "netbirdio/signal",

  volumes: [
    {
      name: "data",
      persistentVolumeClaim: {
        claimName: signalDataVolumeClaim.metadata.name,
      },
    },
  ],

  volumeMounts: [
    {
      name: "data",
      mountPath: "/var/lib/netbird",
    },
  ],

  ports: [
    {
      name: "signal",
      appProtocol: "TCP",
      port: 80,
    },
  ],
})

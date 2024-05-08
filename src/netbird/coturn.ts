import { createConfigMap, createReplicaService, trimIndentation } from "../common"
import { externalIp, namespace } from "./shared"

const coturnConfigMap = createConfigMap({
  name: "coturn-config",
  namespace,

  key: "turnserver.conf",
  value: trimIndentation(`
    listening-port=3478
    tls-listening-port=5349

    external-ip=${externalIp}

    min-port=49152
    max-port=65535

    fingerprint
    lt-cred-mech

    # cert=/etc/coturn/certs/cert.pem
    # pkey=/etc/coturn/private/privkey.pem

    log-file=stdout
    no-software-attribute
    pidfile="/var/tmp/turnserver.pid"
    no-cli
  `),
})

void createReplicaService({
  name: "coturn",
  namespace,

  image: "coturn/coturn",

  volumes: [
    {
      name: "config",
      configMap: {
        name: coturnConfigMap.metadata.name,
        items: [{ key: "turnserver.conf", path: "turnserver.conf" }],
      },
    },
  ],

  volumeMounts: [
    {
      name: "config",
      mountPath: "/etc/turnserver.conf",
      subPath: "turnserver.conf",
      readOnly: true,
    },
  ],

  ports: [{ name: "turn", port: 3478 }],
})

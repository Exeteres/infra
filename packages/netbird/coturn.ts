import { trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"

export function createCoturnService(prefix: string, namespace: k8s.raw.core.v1.Namespace, replicas: number) {
  const coturnConfigMap = k8s.createConfigMap({
    name: `${prefix}-coturn-config`,
    namespace,

    key: "turnserver.conf",
    value: trimIndentation(`
      listening-port=3478
      tls-listening-port=5349

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

  return k8s.createWorkloadService({
    name: `${prefix}-coturn`,
    namespace,

    kind: "Deployment",

    replicas,
    oneReplicaPerNode: true,

    container: {
      image: "coturn/coturn:4.6.2-alpine",

      volumeMounts: [
        {
          name: "config",
          mountPath: "/etc/turnserver.conf",
          subPath: "turnserver.conf",
          readOnly: true,
        },
      ],

      env: [
        {
          name: "EXTERNAL_IP",
          valueFrom: {
            fieldRef: {
              fieldPath: "status.hostIP",
            },
          },
        },
      ],
    },

    volumes: [
      {
        name: "config",
        configMap: {
          name: coturnConfigMap.metadata.name,
          items: [{ key: "turnserver.conf", path: "turnserver.conf" }],
        },
      },
    ],

    port: 3478,
  })
}

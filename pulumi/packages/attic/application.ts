import { pulumi, trimIndentation } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.GatewayApplicationOptions {
  /**
   * The database credentials.
   */
  databaseCredentials: postgresql.DatabaseCredentials

  /**
   * The value of the server token secret.
   * If not provided, the server token secret will be generated.
   */
  serverTokenSecret?: pulumi.Input<string>
}

export interface Application extends k8s.Application, gw.GatewayApplication {
  /**
   * The data volume claim.
   */
  dataVolumeClaim: k8s.raw.core.v1.PersistentVolumeClaim

  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"StatefulSet">
}

export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "attic"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const configSecret = k8s.createSecret({
    name: k8s.getPrefixedName("config", options.prefix),
    namespace,

    realName: "config",

    key: "config.json",
    value: pulumi.interpolate`  
      [database]
      url = "${options.databaseCredentials.url}"

      [storage]
      type = "local"
      path = "/data"

      [chunking]
      avg-size = 65536
      max-size = 262144
      min-size = 16384
      nar-size-threshold = 65536
    `.apply(trimIndentation),
  })

  const serverTokenSecret = k8s.createRandomSecret({
    name: k8s.getPrefixedName("server-token-secret", options.prefix),
    namespace,

    key: "secret",

    length: 64,
    format: "base64",

    existingValue: options.serverTokenSecret,
  })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("data", options.prefix),
    namespace,

    realName: "data",

    capacity: "1Gi",
  })

  const workloadService = k8s.createWorkloadService({
    name: fullName,
    namespace,

    kind: "StatefulSet",

    annotations: options.annotations,
    labels: options.labels,

    nodeSelector: options.nodeSelector,

    port: 8080,

    container: {
      image: "ghcr.io/exeteres/attic:34l73mdkbl59fhrq0avgm7i9401jjv20",
      command: ["/bin/atticd", "--config", "/etc/attic/config.json"],

      volumeMounts: [
        {
          name: configSecret.metadata.name,
          mountPath: "/etc/attic",
        },
        {
          name: dataVolumeClaim.metadata.name,
          mountPath: "/data",
        },
      ],

      environment: {
        ATTIC_SERVER_TOKEN_HS256_SECRET_BASE64: {
          secretKeyRef: {
            name: serverTokenSecret.metadata.name,
            key: "secret",
          },
        },
      },
    },

    volumes: [configSecret, dataVolumeClaim],
  })

  const gateway = gw.createApplicationGateway(options.gateway, {
    name: fullName,
    namespace,

    httpRoute: {
      name: fullName,
      rule: {
        backendRef: {
          name: workloadService.service.metadata.name,
          port: workloadService.service.spec.ports[0].port,
        },
      },
    },
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    workloadService,
    dataVolumeClaim,
    gateway,
  }
}

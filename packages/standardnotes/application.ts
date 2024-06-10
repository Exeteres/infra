import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { readFile } from "fs/promises"
import { join } from "path"

export interface StandardNotesOptions extends k8s.ApplicationOptions {
  /**
   * The domain to expose the application.
   */
  domain: pulumi.Input<string>

  /**
   * The domain to expose the file server.
   */
  filesDomain: pulumi.Input<string>

  /**
   * The options to configure the service.
   */
  service?: k8s.ChildComponentOptions<k8s.ServiceOptions>

  /**
   * The options to configure the volume claims.
   */
  volumeClaims?: {
    mysql?: k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>
    redis?: k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>
    serverLogs?: k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>
    serverUploads?: k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>
  }

  /**
   * The options to configure the ingresses
   */
  ingresses?: {
    server?: k8s.ChildComponentOptions<k8s.IngressOptions>
    files?: k8s.ChildComponentOptions<k8s.IngressOptions>
  }
}

export interface StandardNotesApplication extends k8s.Application {
  /**
   * The workload services which define the application.
   */
  workloadServices: {
    server: k8s.WorkloadService<"Deployment">
    localstack: k8s.WorkloadService<"Deployment">
    mysql: k8s.WorkloadService<"StatefulSet">
    redis: k8s.WorkloadService<"StatefulSet">
  }

  /**
   * The volume claims which store the application data.
   */
  volumeClaims: {
    mysql: k8s.raw.core.v1.PersistentVolumeClaim
    redis: k8s.raw.core.v1.PersistentVolumeClaim
    serverLogs: k8s.raw.core.v1.PersistentVolumeClaim
    serverUploads: k8s.raw.core.v1.PersistentVolumeClaim
  }

  /**
   * The ingresses which exposes the application.
   */
  ingresses: {
    server?: k8s.raw.networking.v1.Ingress
    files?: k8s.raw.networking.v1.Ingress
  }
}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: StandardNotesOptions): StandardNotesApplication {
  const name = options.name ?? "standardnotes"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const volumeClaims = {
    mysql: k8s.createPersistentVolumeClaim({
      name: k8s.getPrefixedName("mysql-data", fullName),
      namespace,

      realName: "mysql-data",

      ...options.volumeClaims?.mysql,
      capacity: "200Mi",
    }),

    redis: k8s.createPersistentVolumeClaim({
      name: k8s.getPrefixedName("redis-data", fullName),
      namespace,

      realName: "redis-data",

      ...options.volumeClaims?.redis,
      capacity: "100Mi",
    }),

    serverLogs: k8s.createPersistentVolumeClaim({
      name: k8s.getPrefixedName("server-logs", fullName),
      namespace,

      realName: "server-logs",

      ...options.volumeClaims?.serverLogs,
      capacity: "50Mi",
    }),

    serverUploads: k8s.createPersistentVolumeClaim({
      name: k8s.getPrefixedName("server-uploads", fullName),
      namespace,

      realName: "server-uploads",

      ...options.volumeClaims?.serverUploads,
      capacity: "1Gi",
    }),
  }

  const mysqlPassword = k8s.createPasswordSecret({
    name: k8s.getPrefixedName("mysql-password", fullName),
    namespace,

    realName: "mysql-password",

    key: "password",
    length: 16,
  })

  const mysqlRootPassword = k8s.createPasswordSecret({
    name: k8s.getPrefixedName("mysql-root-password", fullName),
    namespace,

    realName: "mysql-root-password",

    key: "password",
    length: 16,
  })

  const authJwtSecret = k8s.createRandomSecret({
    name: k8s.getPrefixedName("auth-secret", fullName),
    namespace,

    realName: "auth-secret",

    key: "secret",
    length: 32,
  })

  const authEncryptionServerKey = k8s.createRandomSecret({
    name: k8s.getPrefixedName("encryption-server-key", fullName),
    namespace,

    realName: "encryption-server-key",

    key: "key",
    length: 32,
  })

  const valetTokenSecret = k8s.createRandomSecret({
    name: k8s.getPrefixedName("valet-token-secret", fullName),
    namespace,

    realName: "valet-token-secret",

    key: "token",
    length: 32,
  })

  const localStackBootstrapScript = k8s.createConfigMap({
    name: k8s.getPrefixedName("localstack-bootstrap-script", fullName),
    namespace,

    realName: "localstack-bootstrap-script",

    key: "localstack_bootstrap.sh",
    value: pulumi.output(readFile(join(__dirname, "localstack_bootstrap.sh"), "utf-8")),
  })

  const localstack = k8s.createWorkloadService({
    name: k8s.getPrefixedName("localstack", fullName),
    namespace,

    realName: "localstack",

    kind: "Deployment",
    port: 4566,

    container: {
      image: "localstack/localstack:3.0",

      environment: {
        SERVICES: "sns,sqs",
        LS_LOG: "warn",
      },

      volumeMounts: [
        {
          name: "localstack-bootstrap",
          mountPath: "/etc/localstack/init/ready.d",
        },
      ],
    },

    volume: {
      name: "localstack-bootstrap",
      configMap: {
        name: localStackBootstrapScript.metadata.name,
        items: [
          {
            key: "localstack_bootstrap.sh",
            path: "localstack_bootstrap.sh",
            mode: 0o755,
          },
        ],
      },
    },
  })

  const mysql = k8s.createWorkloadService({
    name: k8s.getPrefixedName("mysql", fullName),
    namespace,

    realName: "mysql",

    kind: "StatefulSet",
    port: 3306,

    container: {
      image: "mysql:8",

      args: ["--character-set-server=utf8mb4", "--collation-server=utf8mb4_general_ci"],

      environment: {
        MYSQL_DATABASE: "standardnotes",
        MYSQL_USER: "standardnotes",
        MYSQL_ROOT_PASSWORD: {
          secretKeyRef: k8s.mapSecretToRef(mysqlRootPassword, "password"),
        },
        MYSQL_PASSWORD: {
          secretKeyRef: k8s.mapSecretToRef(mysqlPassword, "password"),
        },
      },

      volumeMounts: [{ name: volumeClaims.mysql.metadata.name, mountPath: "/var/lib/mysql" }],
    },

    volume: volumeClaims.mysql,
  })

  const redis = k8s.createWorkloadService({
    name: k8s.getPrefixedName("redis", fullName),
    namespace,

    realName: "redis",

    kind: "StatefulSet",
    port: 6379,

    container: {
      image: "redis:6.0-alpine",
      volumeMounts: [{ name: volumeClaims.redis.metadata.name, mountPath: "/data" }],
    },

    volume: volumeClaims.redis,
  })

  const server = k8s.createWorkloadService({
    name: k8s.getPrefixedName("server", fullName),
    namespace,

    realName: "server",

    kind: "Deployment",
    ports: [
      { name: "api", port: 3000 },
      { name: "files", port: 3104 },
    ],

    container: {
      image: "standardnotes/server",
      environment: {
        // Database
        DB_HOST: mysql.service.metadata.name,
        DB_PORT: pulumi.interpolate`${mysql.service.spec.ports[0].port}`,
        DB_USERNAME: "standardnotes",
        DB_PASSWORD: {
          secretKeyRef: k8s.mapSecretToRef(mysqlPassword, "password"),
        },
        DB_DATABASE: "standardnotes",
        DB_TYPE: "mysql",

        // Redis
        REDIS_HOST: redis.service.metadata.name,
        REDIS_PORT: pulumi.interpolate`${redis.service.spec.ports[0].port}`,
        CACHE_TYPE: "redis",

        // Auth
        AUTH_SERVER_SNS_ENDPOINT: pulumi.interpolate`http://${name}:${localstack.service.spec.ports[0].port}`,
        AUTH_SERVER_SQS_ENDPOINT: pulumi.interpolate`http://${name}:${localstack.service.spec.ports[0].port}`,
        AUTH_JWT_SECRET: {
          secretKeyRef: k8s.mapSecretToRef(authJwtSecret, "secret"),
        },
        AUTH_SERVER_ENCRYPTION_SERVER_KEY: {
          secretKeyRef: k8s.mapSecretToRef(authEncryptionServerKey, "key"),
        },
        VALET_TOKEN_SECRET: {
          secretKeyRef: k8s.mapSecretToRef(valetTokenSecret, "token"),
        },

        // Public files
        PUBLIC_FILES_SERVER_URL: pulumi.interpolate`https://${options.filesDomain}`,
      },

      volumeMounts: [
        { name: volumeClaims.serverLogs.metadata.name, mountPath: "/var/lib/server/logs" },
        { name: volumeClaims.serverUploads.metadata.name, mountPath: "/opt/server/packages/files/dist/uploads" },
      ],
    },

    volumes: [volumeClaims.serverLogs, volumeClaims.serverUploads],
  })

  const workloadServices = {
    server,
    localstack,
    mysql,
    redis,
  }

  const serverIngress =
    options.ingresses?.server &&
    k8s.createIngress({
      name: fullName,
      namespace,
      ...options.ingresses.server,
      rules: [
        {
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: workloadServices.server.service.metadata.name,
                    port: { number: workloadServices.server.service.spec.ports[0].port },
                  },
                },
              },
            ],
          },
        },
      ],
    })

  const filesIngress =
    options.ingresses?.files &&
    k8s.createIngress({
      name: k8s.getPrefixedName("files", fullName),
      namespace,
      ...options.ingresses.files,
      rules: [
        {
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: workloadServices.server.service.metadata.name,
                    port: { number: workloadServices.server.service.spec.ports[1].port },
                  },
                },
              },
            ],
          },
        },
      ],
    })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    workloadServices,
    volumeClaims,

    ingresses: {
      server: serverIngress,
      files: filesIngress,
    },
  }
}

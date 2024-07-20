import { pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"
import { restic } from "@infra/restic"
import { readFile } from "fs/promises"
import { join } from "path"

export interface StandardNotesOptions extends k8s.ApplicationOptions, gw.GatewayApplicationOptions {
  /**
   * The domain to expose the application.
   */
  domain: pulumi.Input<string>

  /**
   * The domain to expose the file server.
   */
  filesDomain: pulumi.Input<string>

  /**
   * The options to configure the volume claim.
   */
  uploadsVolumeClaim?: k8s.ChildComponentOptions<k8s.PersistentVolumeClaimOptions>

  filesGateway?: gw.ApplicationGatewayOptions

  /**
   * The database credentials.
   */
  databaseCredentials: mariadb.DatabaseCredentials

  /**
   * The options for the uploads backup.
   * If not specified, backups will be disabled.
   */
  uploadsBackup?: restic.BackupOptions

  /**
   * The encryption server key.
   * If not specified, a random key will be generated.
   */
  encryptionServerKey?: pulumi.Input<string>

  /**
   * The auth secret key.
   * If not specified, a random secret will be generated.
   */
  authSecretKey?: pulumi.Input<string>

  /**
   * The valet token secret.
   * If not specified, a random secret will be generated.
   */
  valetTokenSecret?: pulumi.Input<string>
}

export interface StandardNotesApplication extends k8s.Application, gw.GatewayApplication {
  /**
   * The workload services which define the application.
   */
  workloadServices: {
    server: k8s.WorkloadService<"Deployment">
    localstack: k8s.WorkloadService<"Deployment">
    redis: k8s.WorkloadService<"StatefulSet">
  }

  /**
   * The volume claim for the uploads.
   */
  uploadsVolumeClaim: k8s.raw.core.v1.PersistentVolumeClaim

  filesGateway?: gw.Bundle
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

  const uploadsVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("server-uploads", fullName),
    namespace,

    realName: "server-uploads",

    ...options.uploadsVolumeClaim,
    capacity: "1Gi",
  })

  const authJwtSecret = k8s.createRandomSecret({
    name: k8s.getPrefixedName("auth-secret", fullName),
    namespace,

    realName: "auth-secret",

    key: "secret",
    length: 32,

    existingValue: options.authSecretKey,
  })

  const authEncryptionServerKey = k8s.createRandomSecret({
    name: k8s.getPrefixedName("encryption-server-key", fullName),
    namespace,

    realName: "encryption-server-key",

    key: "key",
    length: 32,

    existingValue: options.encryptionServerKey,
  })

  const valetTokenSecret = k8s.createRandomSecret({
    name: k8s.getPrefixedName("valet-token-secret", fullName),
    namespace,

    realName: "valet-token-secret",

    key: "token",
    length: 32,

    existingValue: options.valetTokenSecret,
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
    nodeSelector: options.nodeSelector,

    container: {
      image: "localstack/localstack:3.0",

      environment: {
        SERVICES: "sns,sqs",
        HOSTNAME_EXTERNAL: "localstack",
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

  const redis = k8s.createWorkloadService({
    name: k8s.getPrefixedName("redis", fullName),
    namespace,

    realName: "redis",

    kind: "StatefulSet",
    port: 6379,
    nodeSelector: options.nodeSelector,

    container: {
      image: "redis:6.0-alpine",
    },
  })

  const databaseSecret = pulumi.output(options.databaseCredentials.secret)

  const initContainers: pulumi.Input<k8s.raw.types.input.core.v1.Container[]> = []
  const sidecarContainers: pulumi.Input<k8s.raw.types.input.core.v1.Container[]> = []
  const extraVolumes: pulumi.Input<k8s.raw.types.input.core.v1.Volume[]> = []

  if (options.uploadsBackup) {
    const bundle = restic.createScriptBundle({
      name: k8s.getPrefixedName("backup", fullName),
      namespace,

      repository: options.uploadsBackup.repository,
    })

    restic.createBackupCronJob({
      name: k8s.getPrefixedName("uploads", fullName),
      namespace,

      options: options.uploadsBackup,
      bundle,
      volumeClaim: uploadsVolumeClaim,
    })

    const { volumes, initContainer, sidecarContainer } = restic.createExtraContainers({
      name: k8s.getPrefixedName("uploads", fullName),
      namespace,

      options: options.uploadsBackup,
      bundle,
      volume: uploadsVolumeClaim.metadata.name,
    })

    initContainers.push(initContainer)
    sidecarContainers.push(sidecarContainer)
    extraVolumes.push(...volumes)
  }

  const server = k8s.createWorkloadService({
    name: k8s.getPrefixedName("server", fullName),
    namespace,

    realName: "server",

    kind: "Deployment",
    ports: [
      { name: "api", port: 3000 },
      { name: "files", port: 3104 },
    ],

    initContainers: initContainers,

    volume: uploadsVolumeClaim,
    volumes: extraVolumes,
    nodeSelector: options.nodeSelector,

    container: {
      image: "standardnotes/server:9de33528853f22187f10a49fe301756cc8c65fa8",

      environment: {
        // Database
        DB_TYPE: "mysql",
        DB_HOST: {
          secretKeyRef: k8s.mapSecretToRef(databaseSecret, "host"),
        },
        DB_PORT: {
          secretKeyRef: k8s.mapSecretToRef(databaseSecret, "port"),
        },
        DB_USERNAME: {
          secretKeyRef: k8s.mapSecretToRef(databaseSecret, "username"),
        },
        DB_PASSWORD: {
          secretKeyRef: k8s.mapSecretToRef(databaseSecret, "password"),
        },
        DB_DATABASE: {
          secretKeyRef: k8s.mapSecretToRef(databaseSecret, "database"),
        },

        // Cache
        CACHE_TYPE: "redis",
        REDIS_HOST: redis.service.metadata.name,
        REDIS_PORT: pulumi.interpolate`${redis.service.spec.ports[0].port}`,

        // Auth
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

      volumeMounts: [{ name: uploadsVolumeClaim.metadata.name, mountPath: "/opt/server/packages/files/dist/uploads" }],
    },

    containers: sidecarContainers,
  })

  const workloadServices = {
    server,
    localstack,
    redis,
  }

  const gateway = gw.createApplicationGateway(options.gateway, {
    name: fullName,
    namespace,

    httpRoute: {
      name: fullName,
      rule: {
        backendRef: {
          name: workloadServices.server.service.metadata.name,
          port: workloadServices.server.service.spec.ports[0].port,
        },
      },
    },
  })

  const filesGateway = gw.createApplicationGateway(options.gateway, {
    name: k8s.getPrefixedName("files", fullName),
    namespace,

    httpRoute: {
      name: k8s.getPrefixedName("files", fullName),
      rule: {
        backendRef: {
          name: workloadServices.server.service.metadata.name,
          port: workloadServices.server.service.spec.ports[1].port,
        },
      },
    },
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    workloadServices,
    uploadsVolumeClaim,

    gateway,
    filesGateway,
  }
}

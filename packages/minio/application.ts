import { merge, pulumi, random } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { restic } from "@infra/restic"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions, gw.GatewayApplicationOptions {
  backup?: restic.BackupOptions
  rootPassword?: pulumi.Input<string>
  consoleGateway?: gw.ApplicationGatewayOptions
}

export interface Application extends k8s.ReleaseApplication, gw.GatewayApplication {
  rootPasswordSecret: k8s.raw.core.v1.Secret
  dataVolumeClaim: k8s.raw.core.v1.PersistentVolumeClaim
  consoleGateway?: gw.Bundle
}

export function createApplication(options: ApplicationOptions = {}): Application {
  const name = options.name ?? "minio"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const rootPasswordSecret = k8s.createSecret({
    name: k8s.getPrefixedName("root-password", fullName),
    namespace,

    realName: "root-password",

    data: {
      username: "admin",
      password:
        options.rootPassword ??
        random.createPassword({
          name: k8s.getPrefixedName("root-password", fullName),
          parent: namespace,
          length: 16,
        }).result,
    },
  })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("data", fullName),
    namespace,

    capacity: "1Gi",
  })

  const initContainers: k8s.raw.types.input.core.v1.Container[] = []
  const sidecarContainers: k8s.raw.types.input.core.v1.Container[] = []
  const extraVolumes: k8s.raw.types.input.core.v1.Volume[] = []

  if (options.backup) {
    const bundle = restic.createScriptBundle({
      name: k8s.getPrefixedName("backup", fullName),
      namespace,

      repository: options.backup.repository,
    })

    restic.createBackupCronJob({
      name: fullName,
      namespace,

      options: options.backup,
      bundle,
      volumeClaim: dataVolumeClaim,
    })

    const { volumes, initContainer, sidecarContainer } = restic.createExtraContainers({
      name: fullName,
      namespace,

      options: options.backup,
      bundle,
      volume: "data",
    })

    initContainers.push(initContainer)
    sidecarContainers.push(sidecarContainer)
    extraVolumes.push(...volumes)
  }

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    repo: "https://charts.bitnami.com/bitnami",
    chart: "minio",
    version: "14.6.21",

    ...options.releaseOptions,

    values: merge(
      {
        auth: {
          existingSecret: rootPasswordSecret.metadata.name,
          rootUserSecretKey: "username",
          rootPasswordSecretKey: "password",
        },
        nodeSelector: options.nodeSelector,
        persistence: {
          existingClaim: dataVolumeClaim.metadata.name,
        },
        initContainers,
        sidecars: sidecarContainers,
        extraVolumes,
      },
      options.releaseOptions?.values ?? {},
    ),
  })

  const gateway = gw.createApplicationGateway(options.gateway, {
    name: fullName,
    namespace,

    httpRoute: {
      name: fullName,
      rule: {
        backendRef: {
          name: release.name,
          port: 9000,
        },
      },
    },
  })

  const consoleGateway = gw.createApplicationGateway(options.consoleGateway, {
    name: k8s.getPrefixedName("console", fullName),
    namespace,

    httpRoute: {
      name: k8s.getPrefixedName("console", fullName),
      rule: {
        backendRef: {
          name: release.name,
          port: 9001,
        },
      },
    },
  })

  return {
    name,
    fullName,
    namespace,
    prefix: options.prefix,

    rootPasswordSecret,
    release,
    dataVolumeClaim,

    gateway,
    consoleGateway,
  }
}

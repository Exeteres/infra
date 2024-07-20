import { certManager } from "@infra/cert-manager"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { getPrefixedName } from "@infra/k8s/application"
import { restic } from "@infra/restic"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The fully qualified domain name of the Mailu application.
   */
  domain: pulumi.Input<string>

  /**
   * The issuer to create the public certificate for the Mailu web interface.
   */
  publicIssuer: pulumi.Input<certManager.Issuer>

  /**
   * The secret key to use for the Mailu application.
   * If not provided, a random secret key will be generated.
   */
  secretKey?: pulumi.Input<string>

  /**
   * The admin password to use for the Mailu application.
   * If not provided, a random password will be generated.
   */
  adminPassword?: pulumi.Input<string>

  /**
   * The options for the backup.
   * If not specified, backups will be disabled.
   */
  backup?: restic.BackupOptions
}

export interface Application extends k8s.ReleaseApplication {}

/**
 * Creates a ready-to-use Mailu application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "mailu"
  const fullName = getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const secretKeySecret = k8s.createRandomSecret({
    name: `${fullName}-secret-key`,
    namespace,

    key: "secret-key",
    length: 32,

    existingValue: options.secretKey,
  })

  const adminPasswordSecret = k8s.createPasswordSecret({
    name: `${fullName}-admin-password`,
    namespace,

    key: "password",
    length: 16,

    existingValue: options.adminPassword,
  })

  const dataVolumeClaim = k8s.createPersistentVolumeClaim({
    name: k8s.getPrefixedName("storage", fullName),
    namespace,

    capacity: "1Gi",
  })

  const dependencies: pulumi.Resource[] = [secretKeySecret, adminPasswordSecret, dataVolumeClaim]

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

    const { volumes, initContainer } = restic.createExtraContainers({
      name: fullName,
      namespace,

      options: options.backup,
      bundle,
      volume: dataVolumeClaim.metadata.name,
    })

    const restoreJob = k8s.createWorkload({
      name: k8s.getPrefixedName("restore", fullName),
      namespace,

      kind: "Job",
      container: initContainer,
      volume: dataVolumeClaim,
      volumes,
    })

    dependencies.push(restoreJob)
  }

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    dependsOn: [secretKeySecret, adminPasswordSecret],

    chart: "mailu",
    repo: "https://mailu.github.io/helm-charts",
    version: "1.5.0",

    values: {
      domain: options.domain,
      hostnames: [pulumi.interpolate`mail.${options.domain}`],

      ingress: {
        annotations: {
          "kubernetes.io/ingress.class": "traefik",
          "cert-manager.io/cluster-issuer": pulumi.output(options.publicIssuer).metadata.apply(m => m!.name),
        },
      },

      persistence: {
        size: "1Gi",
        existingClaim: dataVolumeClaim.metadata.name,
      },

      redis: {
        master: {
          nodeSelector: options.nodeSelector,
          persistence: {
            size: "100Mi",
          },
        },
      },

      existingSecret: secretKeySecret.metadata.name,

      initialAccount: {
        enabled: true,
        username: "admin",
        domain: options.domain,
        existingSecret: adminPasswordSecret.metadata.name,
        existingSecretPasswordKey: "password",
      },

      clamav: {
        enabled: false,
      },

      front: {
        nodeSelector: options.nodeSelector,
      },

      admin: {
        nodeSelector: options.nodeSelector,
      },

      postfix: {
        nodeSelector: options.nodeSelector,
      },

      dovecot: {
        nodeSelector: options.nodeSelector,
      },

      rspamd: {
        nodeSelector: options.nodeSelector,
      },

      webmail: {
        nodeSelector: options.nodeSelector,
      },

      oletools: {
        nodeSelector: options.nodeSelector,
      },
    },
  })

  return {
    name,
    fullName,
    prefix: options.prefix,
    namespace,
    release,
  }
}

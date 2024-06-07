import { certManager } from "@infra/cert-manager"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { getPrefixedName } from "@infra/k8s/application"

export interface MailuOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The fully qualified domain name of the Mailu application.
   */
  domain: pulumi.Input<string>

  /**
   * The issuer to create the public certificate for the Mailu web interface.
   */
  publicIssuer: pulumi.Input<certManager.Issuer>
}

export interface MailuApplication extends k8s.ReleaseApplication {}

/**
 * Creates a ready-to-use Mailu application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: MailuOptions): MailuApplication {
  const name = options.name ?? "mailu"
  const fullName = getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const secretKeySecret = k8s.createRandomSecret({
    name: `${fullName}-secret-key`,
    namespace,

    key: "secret-key",
    length: 32,
  })

  const adminPasswordSecret = k8s.createPasswordSecret({
    name: `${fullName}-admin-password`,
    namespace,

    key: "password",
    length: 16,
  })

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
        single_pvc: false,
      },

      redis: {
        master: {
          nodeSelector: options.nodeSelector,
          persistence: {
            size: "100Mi",
          },
        },
      },

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

        persistence: {
          size: "100Mi",
        },
      },

      postfix: {
        nodeSelector: options.nodeSelector,

        persistence: {
          size: "200Mi",
        },
      },

      dovecot: {
        nodeSelector: options.nodeSelector,

        persistence: {
          size: "100Mi",
        },
      },

      rspamd: {
        nodeSelector: options.nodeSelector,

        persistence: {
          size: "200Mi",
        },
      },

      webmail: {
        nodeSelector: options.nodeSelector,

        persistence: {
          size: "100Mi",
        },
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

import { certManager } from "@infra/cert-manager"
import { pulumi } from "@infra/core"
import { CommonAppOptions, createHelmRelease, createPasswordSecret, createRandomSecret } from "@infra/k8s"

interface MailuAppOptions extends CommonAppOptions {
  /**
   * The fully qualified domain name of the Mailu application.
   */
  domain: pulumi.Input<string>

  /**
   * The issuer to create the public certificate for the Mailu web interface.
   */
  publicIssuer: certManager.certmanager.v1.Issuer | certManager.certmanager.v1.ClusterIssuer
}

/**
 * Creates a ready-to-use Mailu application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createMailuApp(options: MailuAppOptions) {
  const secretKeySecret = createRandomSecret({
    name: "secret-key",
    namespace: options.namespace,

    key: "secret-key",
    length: 32,
  })

  const adminPasswordSecret = createPasswordSecret({
    name: "admin-password",
    namespace: options.namespace,

    key: "password",
    length: 16,
  })

  const mailuRelease = createHelmRelease({
    name: options.name ?? "mailu",
    namespace: options.namespace,

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
          "cert-manager.io/cluster-issuer": options.publicIssuer.metadata.apply(m => m!.name),
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

  return { mailuRelease }
}

import { merge, pulumi, random, trimIndentation } from "@infra/core"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ReleaseApplicationOptions {
  /**
   * The fully qualified domain name.
   */
  domain: pulumi.Input<string>

  /**
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>
}

export interface Application extends k8s.ReleaseApplication {
  /**
   * The ingress which exposes the application.
   */
  ingress?: k8s.raw.networking.v1.Ingress
}

/**
 * Creates a ready-to-use application.
 *
 * TODO: WIP, apps cannot be installed due to "Error: This app cannot be enabled because it makes the server unstable"
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "nextcloud"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  const appSecret = k8s.createSecret({
    name: fullName,
    namespace,

    data: {
      adminUsername: "admin",

      adminPassword: random.createPassword({
        name: k8s.getPrefixedName("admin-password", fullName),
        parent: namespace,

        length: 16,
      }).result,
    },
  })

  const mariadbSecret = k8s.createSecret({
    name: k8s.getPrefixedName("mariadb", fullName),
    namespace,

    data: {
      "mariadb-user": "nextcloud",
      "mariadb-database": "nextcloud",

      "mariadb-password": random.createPassword({
        name: k8s.getPrefixedName("mariadb-password", fullName),
        parent: namespace,

        length: 16,
      }).result,

      "mariadb-root-password": random.createPassword({
        name: k8s.getPrefixedName("mariadb-root-password", fullName),
        parent: namespace,

        length: 16,
      }).result,
    },
  })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    chart: "nextcloud",
    repo: "https://nextcloud.github.io/helm",
    version: "5.0.0",

    ...options.releaseOptions,

    values: merge(
      {
        nodeSelector: options.nodeSelector,

        image: {
          flavor: "fpm",
        },

        nginx: {
          enabled: true,
        },

        nextcloud: {
          host: options.domain,
          existingSecret: {
            enabled: true,
            secretName: appSecret.metadata.name,
            usernameKey: "adminUsername",
            passwordKey: "adminPassword",
          },

          configs: {
            "domain.config.php": trimIndentation(`
              <?php
              $CONFIG = array (
                'overwriteprotocol' => 'https'
              );
            `),
          },
        },

        internalDatabase: {
          enabled: false,
        },

        mariadb: {
          enabled: true,
          nodeSelector: options.nodeSelector,
          auth: {
            database: "nextcloud",
            username: "nextcloud",
            existingSecret: mariadbSecret.metadata.name,
          },
          primary: {
            persistence: {
              enabled: true,
              size: "400Mi",
            },
          },
        },

        externalDatabase: {
          enabled: true,
          type: "mysql",
          existingSecret: {
            enabled: true,
            secretName: mariadbSecret.metadata.name,
            usernameKey: "mariadb-user",
            passwordKey: "mariadb-password",
            databaseKey: "mariadb-database",
          },
        },

        persistence: {
          enabled: true,
          size: "1Gi",
        },
      },
      options.releaseOptions?.values ?? {},
    ),
  })

  const ingress =
    options.ingress &&
    k8s.createIngress({
      name: fullName,
      namespace,

      ...options.ingress,

      rules: [
        {
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: "nextcloud",
                    port: { number: 8080 },
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
    release,
    ingress,
  }
}

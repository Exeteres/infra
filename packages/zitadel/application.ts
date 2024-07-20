import { pulumi, random } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.GatewayApplicationOptions {
  /**
   * The fully qualified domain name of the Zitadel application.
   */
  domain: pulumi.Input<string>

  /**
   * The options to configure the ingress.
   */
  ingress?: k8s.ChildComponentOptions<k8s.IngressOptions>

  /**
   * The host of the database to connect to.
   */
  databaseHost: pulumi.Input<string>

  /**
   * The password for the zitadel user.
   * If not provided, a random password will be created.
   */
  databasePassword?: pulumi.Input<string>

  /**
   * The secret containing the postgres user password.
   * Will be used to create the database user and grant permissions.
   */
  postgresRootPassword: pulumi.Input<string>

  /**
   * The master key secret.
   * If not provided, a random secret will be created.
   */
  masterKey?: pulumi.Input<string>
}

export interface Application extends k8s.ReleaseApplication, gw.GatewayApplication {}

/**
 * Creates a ready-to-use Zitadel application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = options.name ?? "zitadel"
  const namespace = options.namespace ?? k8s.createNamespace({ name })
  const fullName = k8s.getPrefixedName(name, options.prefix)

  // Create secret for master key
  const masterKeySecret = k8s.createRandomSecret({
    name: k8s.getPrefixedName("masterkey", fullName),
    namespace,

    realName: "masterkey",

    key: "masterkey",
    length: 16,

    existingValue: options.masterKey,
  })

  const databasePassword =
    options.databasePassword ??
    random.createPassword({
      name: k8s.getPrefixedName("database-password", fullName),
      parent: namespace,
      length: 16,
    }).result

  const secretConfig = k8s.createSecret({
    name: k8s.getPrefixedName("config", fullName),
    namespace,

    realName: "config",

    key: "config-yaml",
    value: pulumi
      .output({
        Database: {
          Postgres: {
            User: {
              Password: databasePassword,
            },
            Admin: {
              Password: options.postgresRootPassword,
            },
          },
        },
      })
      .apply(JSON.stringify),
  })

  const release = k8s.createHelmRelease({
    name: fullName,
    namespace,

    repo: "https://charts.zitadel.com",
    chart: "zitadel",
    version: "7.14.0",

    values: {
      replicaCount: 1,
      nodeSelector: options.nodeSelector,

      zitadel: {
        masterkeySecretName: masterKeySecret.metadata.name,

        configmapConfig: {
          ExternalSecure: true,
          ExternalDomain: options.domain,
          ExternalPort: 443,
          TLS: {
            Enabled: false,
          },
          Database: {
            Postgres: {
              Host: options.databaseHost,
              Port: 5432,
              Database: "zitadel",
              MaxOpenConns: 20,
              MaxIdleConns: 10,
              MaxConnLifetime: "30m",
              MaxConnIdleTime: "5m",
              User: {
                Username: "zitadel",
                SSL: {
                  Mode: "disable",
                },
              },
              Admin: {
                Username: "postgres",
                SSL: {
                  Mode: "disable",
                },
              },
            },
          },
        },

        configSecretName: secretConfig.metadata.name,
      },
    },
  })

  const gateway = gw.createApplicationGateway(options.gateway, {
    name: fullName,
    namespace,

    httpRoute: {
      name: fullName,
      rule: {
        backendRef: {
          name: release.name,
          port: 8080,
        },
      },
    },
  })

  return {
    name,
    namespace,
    prefix: options.prefix,
    fullName,

    release,
    gateway,
  }
}

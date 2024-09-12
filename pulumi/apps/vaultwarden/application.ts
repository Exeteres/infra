import { pulumi } from "@infra/core"
import { gw } from "@infra/gateway"
import { k8s } from "@infra/k8s"
import { mariadb } from "@infra/mariadb"

export interface ApplicationOptions extends k8s.ApplicationOptions, gw.RoutesApplicationOptions {
  /**
   * The fully qualified domain name.
   */
  domain: pulumi.Input<string>

  /**
   * The database credentials.
   */
  databaseCredentials: mariadb.DatabaseCredentials
}

export interface Application extends k8s.Application, gw.RoutesApplication {
  /**
   * The workload service which defines the application.
   */
  workloadService: k8s.WorkloadService<"Deployment">
}

/**
 * Creates a ready-to-use application.
 *
 * @param options The application options.
 * @returns The release.
 */
export function createApplication(options: ApplicationOptions): Application {
  const name = "vaultwarden"
  const namespace = options.namespace ?? k8s.createNamespace({ name })

  const workloadService = k8s.createWorkloadService({
    name,
    namespace,

    kind: "Deployment",

    port: 80,

    container: {
      image: "vaultwarden/server:1.30.5-alpine",

      environment: {
        DATABASE_URL: {
          secretKeyRef: {
            name: options.databaseCredentials.secret.metadata.name,
            key: "url",
          },
        },
      },
    },
  })

  const routes = gw.createApplicationRoutes(namespace, options.routes, {
    httpRoute: {
      name,
      rule: {
        backend: workloadService.service,
      },
    },
  })

  return {
    namespace,
    workloadService,
    routes,
  }
}

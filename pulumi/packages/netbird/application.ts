import { certManager } from "@infra/cert-manager"
import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { postgresql } from "@infra/postgresql"

export interface ApplicationOptions extends k8s.ApplicationOptions {
  /**
   * The issuer used to bootstrap the ca for communication between the components.
   */
  bootstrapIssuer: pulumi.Input<certManager.Issuer>
}

export interface Application extends k8s.Application {
  /**
   * The database deployed for the application.
   */
  database: postgresql.PostgreSQLApplication
}

export function createApplication(options: ApplicationOptions) {
  const name = options.name ?? "netbird"
  const fullName = k8s.getPrefixedName(name, options.prefix)
  const namespace = options.namespace ?? k8s.createNamespace({ name: fullName })

  const database = postgresql.createApplication({
    namespace,
    bootstrapIssuer: options.bootstrapIssuer,

    releaseOptions: {
      values: {
        auth: {
          database: name,
          user: name,
        },
      },
    },
  })

  const netbirdClientCert = postgresql.createClientCertificate({
    application: database,
    roleName: name,
  })
}

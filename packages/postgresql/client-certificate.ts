import { certManager } from "@infra/cert-manager"
import { PostgreSQLApplication } from "./application"
import { k8s } from "@infra/k8s"

interface ClientCertificateOptions {
  /**
   * The application in which the PostgreSQL role will be created.
   */
  application: PostgreSQLApplication

  /**
   * The name of the PostgreSQL role.
   */
  roleName: string

  /**
   * The name of the certificate to create.
   */
  name?: string
}

/**
 * Creates a PostgreSQL user and certificate for mutual TLS.
 *
 * @param options The options for the PostgreSQL user.
 * @returns The PostgreSQL user and certificate.
 */
export function createClientCertificate(options: ClientCertificateOptions): certManager.CertificateBundle {
  return certManager.createCertificate({
    name: k8s.getPrefixedName(options.name ?? `role-${options.roleName}`, options.application.fullName),
    namespace: options.application.namespace,

    issuer: options.application.issuer,
    commonName: options.roleName,

    dependsOn: options.application.release,
  })
}

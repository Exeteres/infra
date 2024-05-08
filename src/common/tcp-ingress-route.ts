import * as k8s from "@pulumi/kubernetes"

interface TcpIngressRouteOptions {
  name: string
  namespace: k8s.core.v1.Namespace
  domain: string

  serviceName: string
  servicePort: number

  tlsPassthrough?: boolean
}

export const createTcpIngressRoute = ({
  name,
  namespace,
  domain,
  serviceName,
  servicePort,
  tlsPassthrough,
}: TcpIngressRouteOptions) => {
  return new k8s.apiextensions.CustomResource(
    name,
    {
      apiVersion: "traefik.io/v1alpha1",
      kind: "IngressRouteTCP",
      metadata: {
        name,
        namespace: namespace.metadata.name,
      },
      spec: {
        entryPoints: ["websecure"],
        routes: [
          {
            match: `HostSNI(\`${domain}\`)`,
            services: [
              {
                name: serviceName,
                port: servicePort,
              },
            ],
          },
        ],
        tls: {
          passthrough: tlsPassthrough,
        },
      },
    },
    { parent: namespace },
  )
}

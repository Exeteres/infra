import * as k8s from "@pulumi/kubernetes"
import { Input } from "@pulumi/pulumi"

interface IngressRouteOptions {
  name: string
  namespace: k8s.core.v1.Namespace
  domain: string

  enableHttpToHttpsRedirect?: boolean
  path?: string

  serviceName: Input<string>
  serviceNamespace?: Input<string>
  servicePort: Input<number>
  serviceScheme?: "http" | "https" | "h2c"

  replacePathWith?: string
  proxyToUrl?: string

  passHostHeader?: boolean
}

const httpToHttpsMiddleware = new k8s.apiextensions.CustomResource("redirect-to-https", {
  apiVersion: "traefik.io/v1alpha1",
  kind: "Middleware",
  metadata: {
    name: "redirect-to-https",
    namespace: "default",
  },
  spec: {
    redirectScheme: {
      scheme: "https",
      permanent: true,
    },
  },
})

export const createIngressRoute = ({
  name,
  namespace,
  domain,
  enableHttpToHttpsRedirect,
  path,
  serviceName,
  serviceNamespace,
  servicePort,
  serviceScheme,
  replacePathWith,
  passHostHeader,
}: IngressRouteOptions) => {
  const middlewares: Input<string>[] = []

  if (replacePathWith) {
    const middleware = new k8s.apiextensions.CustomResource(`${name}-replace-path`, {
      apiVersion: "traefik.io/v1alpha1",
      kind: "Middleware",
      metadata: {
        name: `${name}-replace-path`,
        namespace: namespace.metadata.name,
      },
      spec: {
        replacePath: {
          path: replacePathWith,
        },
      },
    })

    middlewares.push(middleware.metadata.name)
  }

  const matchConditions = [`Host(\`${domain}\`)`]

  if (path) {
    matchConditions.push(`PathPrefix(\`${path}\`)`)
  }

  const match = matchConditions.join(" && ")

  const route = new k8s.apiextensions.CustomResource(
    name,
    {
      apiVersion: "traefik.io/v1alpha1",
      kind: "IngressRoute",
      metadata: {
        name,
        namespace: namespace.metadata.name,
        annotations: {
          "cert-manager.io/cluster-issuer": "letsencrypt",
        },
      },
      spec: {
        entryPoints: ["websecure"],
        routes: [
          {
            kind: "Rule",
            match,
            services: [
              {
                name: serviceName,
                namespace: serviceNamespace,
                port: servicePort,
                scheme: serviceScheme,
                passHostHeader,
              },
            ],
            middlewares: middlewares.map(m => ({ name: m })),
          },
        ],
        tls: {
          secretName: `${domain}-cert`,
        },
      },
    },
    { parent: namespace },
  )

  if (enableHttpToHttpsRedirect) {
    void new k8s.apiextensions.CustomResource(
      `${name}-http-to-https`,
      {
        apiVersion: "traefik.io/v1alpha1",
        kind: "IngressRoute",
        metadata: {
          name: `${name}-http-to-https`,
          namespace: namespace.metadata.name,
        },
        spec: {
          entryPoints: ["web"],
          routes: [
            {
              kind: "Rule",
              match,
              middlewares: [{ name: httpToHttpsMiddleware.metadata.name }],
              services: [
                {
                  name: serviceName,
                  port: servicePort,
                  scheme: serviceScheme,
                },
              ],
            },
          ],
        },
      },
      { parent: route },
    )
  }

  return route
}

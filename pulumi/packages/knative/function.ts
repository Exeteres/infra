import { k8s } from "@infra/k8s"
import { raw } from "./imports"
import { normalizeInputArrayAndMap, pulumi } from "@infra/core"

export interface FunctionOptions extends k8s.CommonOptions {
  /**
   * The full name of the image to run.
   */
  image: pulumi.Input<string>

  /**
   * The environment variables to set in the container.
   */
  environment?: k8s.ContainerEnvironment

  /**
   * The source of environment variables to set in the container.
   * It is like the `envFrom` property, but more convenient to use.
   */
  environmentSource?: pulumi.Input<k8s.ContainerEnvironmentSource>

  /**
   * The sources of environment variables to set in the container.
   * It is like the `envFrom` property, but more convenient to use.
   */
  environmentSources?: pulumi.Input<pulumi.Input<k8s.ContainerEnvironmentSource>[]>
}

export function createFunction(options: FunctionOptions) {
  const labels = {
    "function.knative.dev": "true",
    "function.knative.dev/name": options.name,
  }

  return new raw.serving.v1.Service(
    options.name,
    {
      metadata: k8s.mapMetadata(options, { labels }),

      spec: {
        template: {
          metadata: { labels },
          spec: {
            containers: [
              {
                image: options.image,
                ports: [{ containerPort: 8080 }],
                env: k8s.mapEnvironment(options.environment),
                envFrom: normalizeInputArrayAndMap(
                  options.environmentSource,
                  options.environmentSources,
                  k8s.mapEnvironmentSource,
                ),
                livenessProbe: {
                  httpGet: {
                    path: "/health/liveness",
                    port: 8080,
                  },
                },
                readinessProbe: {
                  httpGet: {
                    path: "/health/readiness",
                    port: 8080,
                  },
                  successThreshold: 1,
                },
              },
            ],
            enableServiceLinks: false,
            timeoutSeconds: 300,
          },
        },
        traffic: [
          {
            latestRevision: true,
            percent: 100,
          },
        ],
      },
    },
    k8s.mapPulumiOptions(options, {
      ignoreChanges: ["spec.template.spec.containers"],
    }),
  )
}

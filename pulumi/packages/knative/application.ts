import { command, pulumi } from "@infra/core"
import { gw } from "../gateway"
import { k8s } from "@infra/k8s"

export interface ApplicationOptions extends gw.RoutesApplicationOptions {
  /**
   * The fully qualified domain name.
   */
  domain: pulumi.Input<string>

  /**
   * The namespace where Kouirer will be installed.
   * MUST have name "kourier-system", otherwise it will not work.
   */
  kourierNamespace?: k8s.raw.core.v1.Namespace
}

export interface Application extends gw.RoutesApplication {}

export function createApplication(options: ApplicationOptions): Application {
  const name = "knative"
  const servingNamespace = k8s.createNamespace({ name: "knative-serving" })
  const kourierNamespace = options.kourierNamespace ?? k8s.createNamespace({ name: "kourier-system" })

  const installServingCrds = command.createCommand({
    name: "install-serving-crds",
    parent: servingNamespace,
    dependsOn: servingNamespace,

    create: "kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.14.1/serving-crds.yaml",
    delete:
      "kubectl delete -f https://github.com/knative/serving/releases/download/knative-v1.14.1/serving-crds.yaml || true",
  })

  const installServingCore = command.createCommand({
    name: "install-serving-core",
    parent: servingNamespace,
    dependsOn: installServingCrds,

    create: "kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.14.1/serving-core.yaml",
    delete:
      "kubectl delete -f https://github.com/knative/serving/releases/download/knative-v1.14.1/serving-core.yaml || true",
  })

  const installKourier = command.createCommand({
    name: "install-kourier",
    parent: kourierNamespace,

    create: "kubectl apply -f https://github.com/knative/net-kourier/releases/download/knative-v1.14.0/kourier.yaml",
    delete:
      "kubectl delete -f https://github.com/knative/net-kourier/releases/download/knative-v1.14.0/kourier.yaml || true",
  })

  // Patch the Kourier service to use a ClusterIP instead of a LoadBalancer
  // We do this because we are already using an LB for 80/443 and we don't want to create another one
  // Instead, we will use the existing gateway to route traffic to the Kourier service
  const patchKourier = command.createCommand({
    name: "patch-kourier",
    parent: servingNamespace,
    dependsOn: installKourier,

    create: `kubectl patch svc/kourier -n kourier-system -p '{"spec": {"type": "ClusterIP"}}'`,
  })

  const enableKourier = command.createCommand({
    name: "enable-kourier",
    dependsOn: [patchKourier, installServingCore],
    parent: servingNamespace,

    create: `sleep 5 && kubectl patch configmap/config-network -n knative-serving --type merge -p '${JSON.stringify({
      data: {
        "ingress.class": "kourier.ingress.networking.knative.dev",
        "default-external-scheme": "https",
      },
    })}'`,
  })

  command.createCommand({
    name: k8s.getPrefixedName("set-domain", name),
    parent: servingNamespace,
    dependsOn: enableKourier,

    create: pulumi.interpolate`kubectl patch configmap/config-domain -n knative-serving --type merge -p '{"data":{"${options.domain}":""}}'`,
  })

  const gateway = gw.createApplicationRoutes(kourierNamespace, options.gateway, {
    httpRoute: {
      name,
      rule: {
        backend: {
          name: "kourier",
          port: 80,
        },
      },
    },
  })

  return { gateway }
}

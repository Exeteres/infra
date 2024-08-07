// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as utilities from "../../utilities";

// Export members:
export { MetricArgs } from "./metric";
export type Metric = import("./metric").Metric;
export const Metric: typeof import("./metric").Metric = null as any;
utilities.lazyLoad(exports, ["Metric"], () => require("./metric"));

export { PodAutoscalerArgs } from "./podAutoscaler";
export type PodAutoscaler = import("./podAutoscaler").PodAutoscaler;
export const PodAutoscaler: typeof import("./podAutoscaler").PodAutoscaler = null as any;
utilities.lazyLoad(exports, ["PodAutoscaler"], () => require("./podAutoscaler"));


const _module = {
    version: utilities.getVersion(),
    construct: (name: string, type: string, urn: string): pulumi.Resource => {
        switch (type) {
            case "kubernetes:autoscaling.internal.knative.dev/v1alpha1:Metric":
                return new Metric(name, <any>undefined, { urn })
            case "kubernetes:autoscaling.internal.knative.dev/v1alpha1:PodAutoscaler":
                return new PodAutoscaler(name, <any>undefined, { urn })
            default:
                throw new Error(`unknown resource type ${type}`);
        }
    },
};
pulumi.runtime.registerResourceModule("knative", "autoscaling.internal.knative.dev/v1alpha1", _module)

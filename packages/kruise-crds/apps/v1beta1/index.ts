// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as utilities from "../../utilities";

// Export members:
export { StatefulSetArgs } from "./statefulSet";
export type StatefulSet = import("./statefulSet").StatefulSet;
export const StatefulSet: typeof import("./statefulSet").StatefulSet = null as any;
utilities.lazyLoad(exports, ["StatefulSet"], () => require("./statefulSet"));


const _module = {
    version: utilities.getVersion(),
    construct: (name: string, type: string, urn: string): pulumi.Resource => {
        switch (type) {
            case "kubernetes:apps.kruise.io/v1beta1:StatefulSet":
                return new StatefulSet(name, <any>undefined, { urn })
            default:
                throw new Error(`unknown resource type ${type}`);
        }
    },
};
pulumi.runtime.registerResourceModule("kruise", "apps.kruise.io/v1beta1", _module)
// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../../types/input";
import * as outputs from "../../types/output";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * DaemonSet is the Schema for the daemonsets API
 */
export class DaemonSet extends pulumi.CustomResource {
    /**
     * Get an existing DaemonSet resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): DaemonSet {
        return new DaemonSet(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:apps.kruise.io/v1alpha1:DaemonSet';

    /**
     * Returns true if the given object is an instance of DaemonSet.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is DaemonSet {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === DaemonSet.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"apps.kruise.io/v1alpha1" | undefined>;
    public readonly kind!: pulumi.Output<"DaemonSet" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * DaemonSetSpec defines the desired state of DaemonSet
     */
    public readonly spec!: pulumi.Output<outputs.apps.v1alpha1.DaemonSetSpec | undefined>;
    /**
     * DaemonSetStatus defines the observed state of DaemonSet
     */
    public readonly status!: pulumi.Output<outputs.apps.v1alpha1.DaemonSetStatus | undefined>;

    /**
     * Create a DaemonSet resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: DaemonSetArgs, opts?: pulumi.CustomResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            resourceInputs["apiVersion"] = "apps.kruise.io/v1alpha1";
            resourceInputs["kind"] = "DaemonSet";
            resourceInputs["metadata"] = args ? args.metadata : undefined;
            resourceInputs["spec"] = args ? args.spec : undefined;
            resourceInputs["status"] = args ? args.status : undefined;
        } else {
            resourceInputs["apiVersion"] = undefined /*out*/;
            resourceInputs["kind"] = undefined /*out*/;
            resourceInputs["metadata"] = undefined /*out*/;
            resourceInputs["spec"] = undefined /*out*/;
            resourceInputs["status"] = undefined /*out*/;
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(DaemonSet.__pulumiType, name, resourceInputs, opts);
    }
}

/**
 * The set of arguments for constructing a DaemonSet resource.
 */
export interface DaemonSetArgs {
    apiVersion?: pulumi.Input<"apps.kruise.io/v1alpha1">;
    kind?: pulumi.Input<"DaemonSet">;
    metadata?: pulumi.Input<ObjectMeta>;
    /**
     * DaemonSetSpec defines the desired state of DaemonSet
     */
    spec?: pulumi.Input<inputs.apps.v1alpha1.DaemonSetSpecArgs>;
    /**
     * DaemonSetStatus defines the observed state of DaemonSet
     */
    status?: pulumi.Input<inputs.apps.v1alpha1.DaemonSetStatusArgs>;
}

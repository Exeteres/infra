// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../../types/input";
import * as outputs from "../../types/output";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * CiliumNetworkPolicy is a Kubernetes third-party resource with an extended version of NetworkPolicy.
 */
export class CiliumNetworkPolicy extends pulumi.CustomResource {
    /**
     * Get an existing CiliumNetworkPolicy resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): CiliumNetworkPolicy {
        return new CiliumNetworkPolicy(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:cilium.io/v2:CiliumNetworkPolicy';

    /**
     * Returns true if the given object is an instance of CiliumNetworkPolicy.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is CiliumNetworkPolicy {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === CiliumNetworkPolicy.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"cilium.io/v2" | undefined>;
    public readonly kind!: pulumi.Output<"CiliumNetworkPolicy" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta>;
    /**
     * Spec is the desired Cilium specific rule specification.
     */
    public readonly spec!: pulumi.Output<any | undefined>;
    /**
     * Specs is a list of desired Cilium specific rule specification.
     */
    public readonly specs!: pulumi.Output<any[] | undefined>;
    /**
     * Status is the status of the Cilium policy rule
     */
    public readonly status!: pulumi.Output<outputs.cilium.v2.CiliumNetworkPolicyStatus | undefined>;

    /**
     * Create a CiliumNetworkPolicy resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: CiliumNetworkPolicyArgs, opts?: pulumi.CustomResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            resourceInputs["apiVersion"] = "cilium.io/v2";
            resourceInputs["kind"] = "CiliumNetworkPolicy";
            resourceInputs["metadata"] = args ? args.metadata : undefined;
            resourceInputs["spec"] = args ? args.spec : undefined;
            resourceInputs["specs"] = args ? args.specs : undefined;
            resourceInputs["status"] = args ? args.status : undefined;
        } else {
            resourceInputs["apiVersion"] = undefined /*out*/;
            resourceInputs["kind"] = undefined /*out*/;
            resourceInputs["metadata"] = undefined /*out*/;
            resourceInputs["spec"] = undefined /*out*/;
            resourceInputs["specs"] = undefined /*out*/;
            resourceInputs["status"] = undefined /*out*/;
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(CiliumNetworkPolicy.__pulumiType, name, resourceInputs, opts);
    }
}

/**
 * The set of arguments for constructing a CiliumNetworkPolicy resource.
 */
export interface CiliumNetworkPolicyArgs {
    apiVersion?: pulumi.Input<"cilium.io/v2">;
    kind?: pulumi.Input<"CiliumNetworkPolicy">;
    metadata?: pulumi.Input<ObjectMeta>;
    /**
     * Spec is the desired Cilium specific rule specification.
     */
    spec?: any;
    /**
     * Specs is a list of desired Cilium specific rule specification.
     */
    specs?: pulumi.Input<any[]>;
    /**
     * Status is the status of the Cilium policy rule
     */
    status?: pulumi.Input<inputs.cilium.v2.CiliumNetworkPolicyStatusArgs>;
}

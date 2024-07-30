// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../../types/input";
import * as outputs from "../../types/output";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * Route is responsible for configuring ingress over a collection of Revisions.
 * Some of the Revisions a Route distributes traffic over may be specified by
 * referencing the Configuration responsible for creating them; in these cases
 * the Route is additionally responsible for monitoring the Configuration for
 * "latest ready revision" changes, and smoothly rolling out latest revisions.
 * See also: https://github.com/knative/serving/blob/main/docs/spec/overview.md#route
 */
export class Route extends pulumi.CustomResource {
    /**
     * Get an existing Route resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): Route {
        return new Route(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:serving.knative.dev/v1:Route';

    /**
     * Returns true if the given object is an instance of Route.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is Route {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Route.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"serving.knative.dev/v1" | undefined>;
    public readonly kind!: pulumi.Output<"Route" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * Spec holds the desired state of the Route (from the client).
     */
    public readonly spec!: pulumi.Output<outputs.serving.v1.RouteSpec | undefined>;
    /**
     * Status communicates the observed state of the Route (from the controller).
     */
    public readonly status!: pulumi.Output<outputs.serving.v1.RouteStatus | undefined>;

    /**
     * Create a Route resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: RouteArgs, opts?: pulumi.CustomResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            resourceInputs["apiVersion"] = "serving.knative.dev/v1";
            resourceInputs["kind"] = "Route";
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
        super(Route.__pulumiType, name, resourceInputs, opts);
    }
}

/**
 * The set of arguments for constructing a Route resource.
 */
export interface RouteArgs {
    apiVersion?: pulumi.Input<"serving.knative.dev/v1">;
    kind?: pulumi.Input<"Route">;
    metadata?: pulumi.Input<ObjectMeta>;
    /**
     * Spec holds the desired state of the Route (from the client).
     */
    spec?: pulumi.Input<inputs.serving.v1.RouteSpecArgs>;
    /**
     * Status communicates the observed state of the Route (from the controller).
     */
    status?: pulumi.Input<inputs.serving.v1.RouteStatusArgs>;
}

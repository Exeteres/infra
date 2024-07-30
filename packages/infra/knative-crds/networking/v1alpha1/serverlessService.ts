// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../../types/input";
import * as outputs from "../../types/output";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * ServerlessService is a proxy for the K8s service objects containing the
 * endpoints for the revision, whether those are endpoints of the activator or
 * revision pods.
 * See: https://knative.page.link/naxz for details.
 */
export class ServerlessService extends pulumi.CustomResource {
    /**
     * Get an existing ServerlessService resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): ServerlessService {
        return new ServerlessService(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:networking.internal.knative.dev/v1alpha1:ServerlessService';

    /**
     * Returns true if the given object is an instance of ServerlessService.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is ServerlessService {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === ServerlessService.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"networking.internal.knative.dev/v1alpha1" | undefined>;
    public readonly kind!: pulumi.Output<"ServerlessService" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * Spec is the desired state of the ServerlessService.
     * More info: https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     */
    public readonly spec!: pulumi.Output<outputs.networking.v1alpha1.ServerlessServiceSpec | undefined>;
    /**
     * Status is the current state of the ServerlessService.
     * More info: https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     */
    public readonly status!: pulumi.Output<outputs.networking.v1alpha1.ServerlessServiceStatus | undefined>;

    /**
     * Create a ServerlessService resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: ServerlessServiceArgs, opts?: pulumi.CustomResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            resourceInputs["apiVersion"] = "networking.internal.knative.dev/v1alpha1";
            resourceInputs["kind"] = "ServerlessService";
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
        super(ServerlessService.__pulumiType, name, resourceInputs, opts);
    }
}

/**
 * The set of arguments for constructing a ServerlessService resource.
 */
export interface ServerlessServiceArgs {
    apiVersion?: pulumi.Input<"networking.internal.knative.dev/v1alpha1">;
    kind?: pulumi.Input<"ServerlessService">;
    metadata?: pulumi.Input<ObjectMeta>;
    /**
     * Spec is the desired state of the ServerlessService.
     * More info: https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     */
    spec?: pulumi.Input<inputs.networking.v1alpha1.ServerlessServiceSpecArgs>;
    /**
     * Status is the current state of the ServerlessService.
     * More info: https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
     */
    status?: pulumi.Input<inputs.networking.v1alpha1.ServerlessServiceStatusArgs>;
}

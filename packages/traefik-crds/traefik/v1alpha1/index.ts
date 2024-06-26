// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as utilities from "../../utilities";

// Export members:
export { IngressRouteArgs } from "./ingressRoute";
export type IngressRoute = import("./ingressRoute").IngressRoute;
export const IngressRoute: typeof import("./ingressRoute").IngressRoute = null as any;
utilities.lazyLoad(exports, ["IngressRoute"], () => require("./ingressRoute"));

export { IngressRouteTCPArgs } from "./ingressRouteTCP";
export type IngressRouteTCP = import("./ingressRouteTCP").IngressRouteTCP;
export const IngressRouteTCP: typeof import("./ingressRouteTCP").IngressRouteTCP = null as any;
utilities.lazyLoad(exports, ["IngressRouteTCP"], () => require("./ingressRouteTCP"));

export { IngressRouteUDPArgs } from "./ingressRouteUDP";
export type IngressRouteUDP = import("./ingressRouteUDP").IngressRouteUDP;
export const IngressRouteUDP: typeof import("./ingressRouteUDP").IngressRouteUDP = null as any;
utilities.lazyLoad(exports, ["IngressRouteUDP"], () => require("./ingressRouteUDP"));

export { MiddlewareArgs } from "./middleware";
export type Middleware = import("./middleware").Middleware;
export const Middleware: typeof import("./middleware").Middleware = null as any;
utilities.lazyLoad(exports, ["Middleware"], () => require("./middleware"));

export { MiddlewareTCPArgs } from "./middlewareTCP";
export type MiddlewareTCP = import("./middlewareTCP").MiddlewareTCP;
export const MiddlewareTCP: typeof import("./middlewareTCP").MiddlewareTCP = null as any;
utilities.lazyLoad(exports, ["MiddlewareTCP"], () => require("./middlewareTCP"));

export { ServersTransportArgs } from "./serversTransport";
export type ServersTransport = import("./serversTransport").ServersTransport;
export const ServersTransport: typeof import("./serversTransport").ServersTransport = null as any;
utilities.lazyLoad(exports, ["ServersTransport"], () => require("./serversTransport"));

export { ServersTransportTCPArgs } from "./serversTransportTCP";
export type ServersTransportTCP = import("./serversTransportTCP").ServersTransportTCP;
export const ServersTransportTCP: typeof import("./serversTransportTCP").ServersTransportTCP = null as any;
utilities.lazyLoad(exports, ["ServersTransportTCP"], () => require("./serversTransportTCP"));

export { TLSOptionArgs } from "./tlsoption";
export type TLSOption = import("./tlsoption").TLSOption;
export const TLSOption: typeof import("./tlsoption").TLSOption = null as any;
utilities.lazyLoad(exports, ["TLSOption"], () => require("./tlsoption"));

export { TLSStoreArgs } from "./tlsstore";
export type TLSStore = import("./tlsstore").TLSStore;
export const TLSStore: typeof import("./tlsstore").TLSStore = null as any;
utilities.lazyLoad(exports, ["TLSStore"], () => require("./tlsstore"));

export { TraefikServiceArgs } from "./traefikService";
export type TraefikService = import("./traefikService").TraefikService;
export const TraefikService: typeof import("./traefikService").TraefikService = null as any;
utilities.lazyLoad(exports, ["TraefikService"], () => require("./traefikService"));


const _module = {
    version: utilities.getVersion(),
    construct: (name: string, type: string, urn: string): pulumi.Resource => {
        switch (type) {
            case "kubernetes:traefik.io/v1alpha1:IngressRoute":
                return new IngressRoute(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:IngressRouteTCP":
                return new IngressRouteTCP(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:IngressRouteUDP":
                return new IngressRouteUDP(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:Middleware":
                return new Middleware(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:MiddlewareTCP":
                return new MiddlewareTCP(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:ServersTransport":
                return new ServersTransport(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:ServersTransportTCP":
                return new ServersTransportTCP(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:TLSOption":
                return new TLSOption(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:TLSStore":
                return new TLSStore(name, <any>undefined, { urn })
            case "kubernetes:traefik.io/v1alpha1:TraefikService":
                return new TraefikService(name, <any>undefined, { urn })
            default:
                throw new Error(`unknown resource type ${type}`);
        }
    },
};
pulumi.runtime.registerResourceModule("traefik", "traefik.io/v1alpha1", _module)

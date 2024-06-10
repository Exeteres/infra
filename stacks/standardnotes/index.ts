import { pulumi } from "@infra/core"
import { k8s } from "@infra/k8s"
import { standardnotes } from "@infra/standardnotes"

const config = new pulumi.Config("standardnotes")

const domain = config.require("domain")
const filesDomain = config.require("filesDomain")
const hostname = config.require("hostname")
const filesHostname = config.require("filesHostname")
const node = config.require("node")

standardnotes.createApplication({
  domain,
  filesDomain,

  ingresses: {
    server: {
      className: "tailscale",

      tls: {
        hosts: [hostname],
      },
    },
    files: {
      className: "tailscale",

      tls: {
        hosts: [filesHostname],
      },
    },
  },

  nodeSelector: k8s.mapHostnameToNodeSelector(node),
})

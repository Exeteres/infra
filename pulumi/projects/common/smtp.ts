import { k8s } from "@infra/k8s"
import { getStack } from "./stack"
import { singleton } from "./utils"
import { cilium } from "@infra/cilium"
import { smtp } from "@infra/smtp"
import { Output } from "@infra/core"

export const getSmtpService = singleton(() => {
  const stack = getStack("smtp-to-telegram")

  return k8s.import(stack, k8s.raw.core.v1.Service, "serviceId")
})

export const createAllowSmtpServerPolicy = (namespace: k8s.raw.core.v1.Namespace) => {
  return cilium.createAllowServicePolicy({
    name: "allow-smtp-server",
    namespace,

    description: "Allow SMTP traffic to the SMTP server",

    service: getSmtpService(),
  })
}

export const getSmtpCredentials = singleton(() => {
  const stack = getStack("smtp-to-telegram")

  return stack.getOutput("smtpCredentials") as Output<smtp.Credentials>
})

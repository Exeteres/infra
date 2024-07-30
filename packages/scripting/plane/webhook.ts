import { defineFunction, FunctionOptions, z } from "@scripting/core"
import { Cycle, Issue, IssueActivity, IssueComment, Module, Project } from "./models"

type GenericPayload<TName, TData, TExtra = {}> = {
  event: TName
} & ({ action: "created" | "updated"; data: TData } | { action: "deleted"; data: { id: string } }) &
  TExtra

export type ProjectWebhookPayload = GenericPayload<"project", Project>
export type IssueWebhookPayload = GenericPayload<"issue", Issue, { activity: IssueActivity }>
export type CycleWebhookPayload = GenericPayload<"cycle", Cycle>
export type ModuleWebhookPayload = GenericPayload<"module", Module>
export type IssueCommentWebhookPayload = GenericPayload<"issue_comment", IssueComment, { activity: IssueActivity }>

export type WebhookPayload =
  | ProjectWebhookPayload
  | IssueWebhookPayload
  | CycleWebhookPayload
  | ModuleWebhookPayload
  | IssueCommentWebhookPayload

export function defineWebhookHandler(options: Omit<FunctionOptions<WebhookPayload>, "schema">) {
  return defineFunction({
    ...options,
    schema: z.any(),
    handle(context) {
      // TODO: add signature validation

      return options.handle(context as any)
    },
  })
}

import { getEnvironmentVariable, z } from "@scripting/core"
import { createApiClient, defineWebhookHandler } from "@scripting/plane"

const apiClient = createApiClient()
const botId = getEnvironmentVariable("PLANE_BOT_ID", z.string())

defineWebhookHandler({
  async handle({ body }) {
    console.log("Received event", body)

    if (body.event === "issue_comment" && body.action === "created" && body.data.created_by !== botId) {
      await apiClient.createIssueComment("personal", body.data.project, body.data.issue, { comment_html: "Pong" })
    }
  },
})

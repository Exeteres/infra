import { getEnvironmentVariable, z } from "@scripting/core"
import { IssueComment } from "./models"
import { fetch } from "node-fetch-native"

interface CallOptions {
  url: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  headers?: Record<string, string>
  body?: unknown
}

interface IssueCommentInput {
  comment_html: string
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  createIssueComment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    input: IssueCommentInput,
  ): Promise<IssueComment> {
    return this.call({
      url: `workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/`,
      method: "POST",
      body: input,
    })
  }

  private async call(options: CallOptions): Promise<any> {
    console.log(options)

    const result = await fetch(`${this.baseUrl}/${options.url}`, {
      method: options.method,
      headers: {
        "X-API-Key": this.token,
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    console.log(result)

    return result.json()
  }
}

export function createApiClient(): ApiClient {
  const baseUrl = getEnvironmentVariable("PLANE_API_BASE_URL", z.string())
  const token = getEnvironmentVariable("PLANE_API_TOKEN", z.string())

  return new ApiClient(baseUrl, token)
}

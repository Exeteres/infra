export interface Project {
  id: string
  total_members: number
  total_cycles: number
  total_modules: number
  is_member: boolean
  member_role: number
  is_deployed: boolean
  created_at: string
  updated_at: string
  name: string
  description: string
  description_text: null
  description_html: null
  network: number
  identifier: string
  emoji: null
  icon_prop: null
  module_view: boolean
  cycle_view: boolean
  issue_views_view: boolean
  page_view: boolean
  inbox_view: boolean
  cover_image: null
  archive_in: number
  close_in: number
  created_by: string
  updated_by: string
  workspace: string
  default_assignee: null
  project_lead: string
  estimate: null
  default_state: null
}

export interface State {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string
  color: string
  slug: string
  sequence: number
  group: string
  default: boolean
  created_by: string
  updated_by: string
  project: string
  workspace: string
}

export interface Label {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string
  color: string
  sort_order: number
  created_by: string
  updated_by: string
  project: string
  workspace: string
  parent: null
}

export interface Link {
  id: string
  created_at: string
  updated_at: string
  title: string
  url: string
  metadata: Record<string, unknown>
  created_by: string
  updated_by: string
  project: string
  workspace: string
  issue: string
}

export interface Issue {
  id: string
  created_at: string
  updated_at: string
  estimate_point: null
  name: string
  description_html: string
  description_stripped: string
  priority: string
  start_date: string
  target_date: string
  sequence_id: number
  sort_order: number
  completed_at: null
  archived_at: null
  is_draft: boolean
  created_by: string
  updated_by: string
  project: string
  workspace: string
  parent: null
  state: string
  assignees: string[]
  labels: string[]
}

export interface IssueActivity {
  id: string
  created_at: string
  updated_at: string
  verb: string
  field: null
  old_value: null
  new_value: null
  comment: string
  attachments: any[]
  old_identifier: null
  new_identifier: null
  epoch: number
  project: string
  workspace: string
  issue: string
  issue_comment: null
  actor: string
}

export interface IssueComment {
  id: string
  created_at: string
  updated_at: string
  comment_stripped: string
  comment_json: Record<string, unknown>
  comment_html: string
  attachments: any[]
  access: string
  created_by: string
  updated_by: string
  project: string
  workspace: string
  issue: string
  actor: string
}

export interface Module {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string
  description_text: null
  description_html: null
  start_date: null
  target_date: null
  status: string
  view_props: Record<string, unknown>
  sort_order: number
  created_by: string
  updated_by: string
  project: string
  workspace: string
  lead: null
  members: any[]
}

export interface ModuleIssue {
  id: string
  sub_issues_count: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  project: string
  workspace: string
  module: string
  issue: string
}

export interface Cycle {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string
  start_date: null
  end_date: null
  view_props: Record<string, unknown>
  sort_order: number
  created_by: string
  updated_by: string
  project: string
  workspace: string
  owned_by: string
}

export interface CycleIssue {
  id: string
  sub_issues_count: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  project: string
  workspace: string
  cycle: string
  issue: string
}

export interface InboxView {
  id: string
  pending_issue_count: number
  created_at: string
  updated_at: string
  name: string
  description: string
  is_default: boolean
  view_props: Record<string, unknown>
  created_by: string
  updated_by: string
  project: string
  workspace: string
}

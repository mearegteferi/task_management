export type ProjectStatus = 'todo' | 'in_progress' | 'done';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ArchitectRole = 'user' | 'assistant';

export interface UserPublic {
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  full_name: string | null;
  id: string;
  created_at: string | null;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Message {
  message: string;
}

export interface UserUpdateMe {
  full_name?: string | null;
  email?: string | null;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ProjectResponse {
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: number;
  due_date: string | null;
  id: number;
  created_at: string;
  updated_at: string | null;
  owner_id: string;
}

export interface TagResponse {
  name: string;
  color: string;
  id: number;
}

export interface TaskResponse {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  is_completed: boolean;
  id: number;
  project_id: number;
  created_at: string;
  tags: TagResponse[];
}

export interface TaskSuggestion {
  title: string;
  description: string | null;
  estimated_priority: number;
}

export interface ProjectBreakdown {
  title: string;
  description: string | null;
  tasks: TaskSuggestion[];
}

export interface ArchitectSuggestRequest {
  title: string;
  description: string | null;
  goals: string[];
  constraints: string[];
  additional_context: string | null;
}

export interface ArchitectDraftResponse {
  session_id: string;
  draft: ProjectBreakdown;
}

export interface ArchitectConfirmResponse {
  project: ProjectResponse;
  tasks: TaskResponse[];
}

export interface ArchitectChatMessage {
  id: string;
  role: ArchitectRole;
  content: string;
  timestamp: string;
}

export interface CommentResponse {
  content: string;
  id: number;
  task_id: number;
  user_id: string;
  created_at: string;
}

export interface CommentCreate {
  content: string;
}

export interface AttachmentResponse {
  filename: string;
  file_type: string | null;
  id: number;
  task_id: number;
  uploaded_at: string;
}

export interface ProjectStatusCount {
  status: string;
  count: number;
}

export interface TaskStatusCount {
  status: string;
  count: number;
}

export interface TaskPriorityCount {
  priority: number;
  count: number;
}

export interface RecentTaskActivityPoint {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  total_projects: number;
  projects_by_status: ProjectStatusCount[];
  total_tasks: number;
  completed_tasks: number;
  task_completion_rate: number;
  active_projects: number;
  overdue_projects: number;
  average_tasks_per_project: number;
  tasks_by_status: TaskStatusCount[];
  tasks_by_priority: TaskPriorityCount[];
  recent_task_activity: RecentTaskActivityPoint[];
}

export interface UsersPublic {
  data: UserPublic[];
  count: number;
}

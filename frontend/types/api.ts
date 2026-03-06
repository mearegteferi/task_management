export type ProjectStatus = 'todo' | 'in_progress' | 'done';

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
  is_completed: boolean;
  id: number;
  project_id: number;
  created_at: string;
  tags: TagResponse[];
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

export interface AttachmentCreate {
  filename: string;
  file_type?: string | null;
}

export interface ProjectStatusCount {
  status: string;
  count: number;
}

export interface AnalyticsResponse {
  total_projects: number;
  projects_by_status: ProjectStatusCount[];
  total_tasks: number;
}

export interface UsersPublic {
  data: UserPublic[];
  count: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
  created_at?: string | null;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Subtask {
  id: number;
  title: string;
  is_completed: boolean;
  task_id: number;
}

export interface Comment {
  id: number;
  content: string;
  task_id: number;
  user_id: string;
  created_at: string;
  user?: User; // Optional expanded user
}

export interface Attachment {
  id: number;
  filename: string;
  file_type?: string;
  file_path?: string;
  task_id: number;
  uploaded_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: "todo" | "in_progress" | "done";
  priority?: number | null; // 1: Low, 2: Medium, 3: High
  due_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  owner_id: string;
  tags?: Tag[];
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

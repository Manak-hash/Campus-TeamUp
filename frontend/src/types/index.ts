// ──────────────────────────────────────────────
// Shared TypeScript interfaces for Campus TeamUp
// ──────────────────────────────────────────────

// ── Users ────────────────────────────────────

export interface User {
  id: number;
  name: string;
  full_name?: string; // alias — backend may return either
  email: string;
  role: 'student' | 'admin';
  department: string | null;
  academic_level: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  skills?: UserSkill[];
}

// ── Skills ───────────────────────────────────

export interface Skill {
  id: number;
  name: string;
}

export interface UserSkill extends Skill {
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface ProjectSkill extends Skill {
  importance: 'required' | 'nice_to_have';
}

// ── Projects ─────────────────────────────────

export type ProjectStatus = 'open' | 'full' | 'closed';

export type ProjectCategory =
  | 'web-development'
  | 'mobile-development'
  | 'data-science'
  | 'machine-learning'
  | 'design'
  | 'other';

export interface Project {
  id: number;
  owner_id: number;
  owner?: User;
  title: string;
  slug: string;
  description: string;
  category: string;
  max_members: number;
  status: ProjectStatus;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  skills?: ProjectSkill[];
  members?: User[];
  member_count?: number;
  owner_name?: string;
  owner_avatar?: string | null;
  pending_applicant_count?: number;
  user_role?: string;
}

/** Payload sent when creating or updating a project */
export interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  max_members: number;
  deadline: string;
  status?: ProjectStatus;
  skills: { skill_id: number; importance: string }[];
}

// ── Applications ─────────────────────────────

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Application {
  id: number;
  project_id: number;
  project?: Project;
  applicant_id: number;
  applicant?: User;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  project_slug?: string;
  project_title?: string;
  project_status?: ProjectStatus;
}

// ── Notifications ────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ── Bookmarks ────────────────────────────────

export interface Bookmark {
  id: number;
  user_id: number;
  project_id: number;
  project?: Project;
  created_at: string;
}

// ── API Response Wrappers ────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ── Admin ────────────────────────────────────

export interface AdminStats {
  total_users: number;
  total_projects: number;
  total_applications: number;
  open_projects: number;
  recent_users: User[];
  recent_projects: Project[];
}

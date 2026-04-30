/**
 * RBAC System Management Models
 */

export type UserRole = 'ADMIN' | 'TEACHER' | 'FINANCE' | 'STAFF' | 'NURSE' | 'TRANSPORT';

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Computed
  role: UserRole;
  school_id: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  permissions?: string[];
}

export interface UserCreateRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school_id?: string; // Auto-generated if not provided
  is_active: boolean;
}

export interface RoleUpdateRequest {
  role: UserRole;
  reason: string;
}

export interface AccessRevocationRequest {
  action: 'REVOKE_AND_BLACKLIST' | 'REVOKE_ONLY';
  notes: string;
}

export interface PasswordResetResponse {
  temporary_password: string;
  message: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_count: number;
}

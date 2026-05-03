/**
 * RBAC System Management Models
 */

export type UserRole = 'ADMIN' | 'TEACHER' | 'FINANCE' | 'STAFF' | 'NURSE' | 'TRANSPORT';

export interface SystemRolePermission {
  id: number;
  codename: string;
  name: string;
}

export interface SystemRole {
  id: number;
  name: string;
  portal_type: string;
  requires_mfa: boolean;
  permissions: SystemRolePermission[];
}

export interface AdminUser {
  id: string;
  school_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // Computed: first_name + last_name
  role: UserRole;
  portal_type?: string;
  role_name?: string; // Derived from system_role.name
  system_role: SystemRole | null;
  is_active: boolean;
  is_staff: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface RoleUpdateRequest {
  role: UserRole;
}

export interface AccessRevocationRequest {
  action: 'REVOKE_AND_BLACKLIST';
  notes: string;
}

export interface PasswordResetResponse {
  temp_password: string;
  message: string;
}

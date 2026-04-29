/**
 * Authentication Models
 * Core data structures for auth state and API communication
 */

/** JWT Token pair returned from login/refresh */
export interface Tokens {
  access: string;
  refresh: string;
}

/** Nested user object from /me endpoint */
export interface UserProfile {
  firstName: string;
  lastName?: string;
  isActive: boolean;
  email?: string;
  schoolId?: string;
  avatarUrl?: string;
}

/** User context returned from /me endpoint - matches backend API */
export interface UserContext {
  user: UserProfile;
  portalKey: string;
  permissions: string[];
}

/** Portal types in the system */
export type PortalType = 'ADMIN' | 'STAFF' | 'TRANSPORT' | 'STUDENT' | 'PARENT';

/** Login request payload */
export interface LoginRequest {
  school_id: string;
  password: string;
}

/** Login response from API */
export interface LoginResponse {
  access: string;
  refresh: string;
  user?: UserContext;
}

/** Refresh token request */
export interface RefreshRequest {
  refresh: string;
}

/** Permission check helpers */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // GodMode check - [*] grants all permissions
  if (userPermissions.includes('*')) {
    return true;
  }
  return userPermissions.includes(requiredPermission);
}

/** Check if user has any of the required permissions (OR logic) */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  if (userPermissions.includes('*')) {
    return true;
  }
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

/** Check if user has all required permissions (AND logic) */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  if (userPermissions.includes('*')) {
    return true;
  }
  return requiredPermissions.every((p) => userPermissions.includes(p));
}

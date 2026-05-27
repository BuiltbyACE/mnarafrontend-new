/**
 * Portal Types and Route Mappings
 * Defines portal structure and navigation
 */

import type { PortalType } from './auth.models';

/** Portal route mapping for redirects */
export const PORTAL_ROUTES: Record<PortalType, string> = {
  ADMIN: '/admin',
  STAFF: '/teacher', // Staff uses teacher portal
  TRANSPORT: '/transport',
  STUDENT: '/student',
  PARENT: '/parent',
  FINANCE: '/finance',
};

/** Portal display names */
export const PORTAL_DISPLAY_NAMES: Record<PortalType, string> = {
  ADMIN: 'Admin Portal',
  STAFF: 'Staff Portal',
  TRANSPORT: 'Transport Portal',
  STUDENT: 'Student Portal',
  PARENT: 'Parent Portal',
  FINANCE: 'Finance Portal',
};

/** Get portal route for a given portal type */
export function getPortalRoute(portalType: PortalType): string {
  return PORTAL_ROUTES[portalType] || '/login';
}

/** Get display name for portal type */
export function getPortalDisplayName(portalType: PortalType): string {
  return PORTAL_DISPLAY_NAMES[portalType] || 'Unknown Portal';
}

/** Check if portal type is valid */
export function isValidPortalType(value: string): value is PortalType {
  return ['ADMIN', 'STAFF', 'TRANSPORT', 'STUDENT', 'PARENT', 'FINANCE'].includes(value);
}

/** Map backend portalKey to PortalType enum - handles various backend formats */
export function portalKeyToPortalType(portalKey: string): PortalType | null {
  if (!portalKey) return null;

  const mapping: Record<string, PortalType> = {
    // Full portal keys
    'admin-portal': 'ADMIN',
    'staff-portal': 'STAFF',
    'teacher-portal': 'STAFF',
    'transport-portal': 'TRANSPORT',
    'student-portal': 'STUDENT',
    'parent-portal': 'PARENT',
    'finance-portal': 'FINANCE',
    // Short form (common backend variations)
    'admin': 'ADMIN',
    'staff': 'STAFF',
    'teacher': 'STAFF',
    'transport': 'TRANSPORT',
    'student': 'STUDENT',
    'parent': 'PARENT',
    'finance': 'FINANCE',
    // Role-based variations
    'superadmin': 'ADMIN',
    'school_admin': 'ADMIN',
    'school_administrator': 'ADMIN',
    'administrator': 'ADMIN',
    'instructor': 'STAFF',
    'driver': 'TRANSPORT',
    'accountant': 'FINANCE',
    'finance_officer': 'FINANCE',
  };
  return mapping[portalKey.toLowerCase()] ?? null;
}

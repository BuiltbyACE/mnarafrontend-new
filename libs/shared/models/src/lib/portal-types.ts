/**
 * Portal Types and Route Mappings
 * Defines portal structure and navigation
 */

import type { PortalType } from './auth.models';

/** Portal route mapping for redirects */
export const PORTAL_ROUTES: Record<PortalType, string> = {
  ADMIN: '/portalAdmin',
  STAFF: '/portalTeacher', // Staff uses teacher portal
  TRANSPORT: '/portalTransport',
  STUDENT: '/portalStudent',
  PARENT: '/portalParent',
};

/** Portal display names */
export const PORTAL_DISPLAY_NAMES: Record<PortalType, string> = {
  ADMIN: 'Admin Portal',
  STAFF: 'Staff Portal',
  TRANSPORT: 'Transport Portal',
  STUDENT: 'Student Portal',
  PARENT: 'Parent Portal',
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
  return ['ADMIN', 'STAFF', 'TRANSPORT', 'STUDENT', 'PARENT'].includes(value);
}

/** Map backend portalKey to PortalType enum */
export function portalKeyToPortalType(portalKey: string): PortalType | null {
  const mapping: Record<string, PortalType> = {
    'admin-portal': 'ADMIN',
    'staff-portal': 'STAFF',
    'teacher-portal': 'STAFF', // Teachers use STAFF portal
    'transport-portal': 'TRANSPORT',
    'student-portal': 'STUDENT',
    'parent-portal': 'PARENT',
  };
  return mapping[portalKey] ?? null;
}

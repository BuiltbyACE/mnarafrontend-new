export type TeacherStatus =
  | 'IN_CLASS'
  | 'AVAILABLE'
  | 'INSTITUTIONAL_BLOCK'
  | 'RESTRICTED';

export interface LiveLocatorContext {
  subject: string | null;
  year_group: string | null;
  room: string | null;
  ends_at: string | null;
}

export interface LiveLocatorResponse {
  status: TeacherStatus;
  location: string;
  teacher_id: number;
  context: LiveLocatorContext | null;
}

export interface TeacherTrackingPreference {
  id: number;
  teacher: number;
  is_visible_to_students: boolean;
  is_visible_to_admin: boolean;
  tracking_window_start: string;
  tracking_window_end: string;
}

export interface TeacherLocationAudit {
  id: number;
  viewer: number;
  viewer_name: string;
  teacher: number;
  viewed_at: string;
  status_seen: string;
  ip_address: string;
}

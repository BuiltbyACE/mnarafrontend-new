export type VersionStatus = 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface TimetableVersion {
  id: number;
  name: string;
  status: VersionStatus;
  academic_term: number;
  academic_term_name: string;
  term_name: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  entry_count: number;
  is_published: boolean;
}

export interface TimetableVersionWrite {
  name: string;
  academic_term: number;
}

export interface CloneVersionPayload {
  name: string;
  copy_entries?: boolean;
}

export interface CompareCoordinate {
  day_of_week: number;
  tiered_period_id: number;
  year_group_id: number;
  teacher_id: number;
  subject_id: number;
}

export interface CompareEntry extends CompareCoordinate {
  day_name: string;
  period_name: string;
  period_start: string;
  period_end: string;
  year_group_name: string;
  teacher_name: string;
  subject_code: string;
  subject_name: string;
  room_id: number | null;
  room_name: string | null;
  is_practical: boolean;
}

export interface ModifiedEntry {
  before: CompareEntry;
  after: CompareEntry;
  changed_fields: string[];
}

export interface CompareSummary {
  added_count: number;
  removed_count: number;
  modified_count: number;
}

export interface VersionCompareResult {
  version_a: number;
  version_b: number;
  summary: CompareSummary;
  added: CompareEntry[];
  removed: CompareEntry[];
  modified: ModifiedEntry[];
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'ROLLBACK'
  | 'CLONE';

export type AuditEntityType =
  | 'TimetableVersion'
  | 'TimetableEntry'
  | 'BellSchedule'
  | 'TieredPeriod';

export interface AuditLogEntry {
  id: number;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: number | null;
  version: number | null;
  version_name: string | null;
  user: number;
  user_name: string;
  timestamp: string;
  detail: Record<string, unknown> | null;
}

export interface AuditLogFilter {
  version?: number;
  action?: AuditAction;
  entity_type?: AuditEntityType;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface PaginatedAuditLog {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogEntry[];
}

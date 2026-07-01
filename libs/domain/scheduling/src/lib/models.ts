export type AcademicTier = 'EYF' | 'KS1' | 'KS2' | 'KS3';
export type PeriodType = 'TEACHING_BLOCK' | 'BREAK' | 'INSTITUTIONAL_BLOCK' | 'TRANSITION';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4; // 0=Mon, 4=Fri

export interface BellSchedule {
  id: number;
  key_stage: number;
  name: string;
  tier?: AcademicTier;
  is_default_for_key_stage: boolean;
  applies_on_days?: number[];
  periods: BellSchedulePeriod[];
}

export interface BellSchedulePeriod {
  id: number;
  bell_schedule: number;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  period_type: PeriodType;
  label: string;
  is_teaching_block: boolean;
  sequence?: number;
  duration_minutes?: number;
}

export interface TimetableVersion {
  id: number;
  name: string;
  term: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  published_at: string | null;
  published_by: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
  entry_count: number;
}

export interface DateVersionResponse {
  version: TimetableVersion | null;
  term: {
    id: number;
    name: string;
    academic_year: string;
    start_date: string;
    end_date: string;
  } | null;
  is_current: boolean;
  message: string | null;
}

export interface TimetableEntry {
  id: number;
  timetable_version: number;
  course_workspace: number;
  bell_schedule_period: number;
  day_of_week: number;
  year_level: number;
  teacher_id: number;
  teacher_name?: string;
  subject_offering_id: number;
  classroom_name: string;
  subject_name: string;
  period_type?: PeriodType;
  published_teacher_id: number | null;
  published_teacher_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeachingRequirement {
  id: number;
  term: number;
  subject_offering: number;
  required_periods_per_week: number;
  scheduled_count: number;
  subject_name: string;
  year_level_name: string;
}

export interface TimetableAuditLog {
  id: number;
  version: number;
  entry: number | null;
  actor: number | null;
  action: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  timestamp: string;
}

export interface EntryDraft {
  course_workspace_id: number;
  bell_schedule_period_id: number;
  day_of_week: number;
  year_level_id: number;
  timetable_version_id: number;
  teacher_id?: number;
}

export interface ConflictError {
  rule: string;
  code: string;
  message: string;
  context: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ConflictError[];
  warnings: ConflictError[];
}

export interface Teacher {
  id: number;
  profile_id: number;
  name: string;
}

export interface YearLevel {
  id: number;
  name: string;
  order: number;
  key_stage: string | null;
}

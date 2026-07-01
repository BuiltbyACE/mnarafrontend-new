export type TeacherStatus = 'IN_CLASS' | 'AVAILABLE' | 'INSTITUTIONAL_BLOCK' | 'RESTRICTED';

export interface LiveLocatorResponse {
  teacher_id: number;
  teacher_name: string;
  status: TeacherStatus;
  location: string;
  context: {
    subject?: string;
    year_group?: string;
    period?: string;
    ends_at?: string;
  } | null;
  queried_at: string;
}

export interface StaffLocation {
  teacherId: number;
  teacherName: string;
  status: TeacherStatus;
  location: string;
  context: string;
  lastUpdated: Date;
}

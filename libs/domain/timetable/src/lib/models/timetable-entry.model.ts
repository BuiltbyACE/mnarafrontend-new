export interface Room {
  id: number;
  name: string;
  capacity: number | null;
  room_type: string;
  is_lab: boolean;
  building: string;
  floor: number | null;
  is_active: boolean;
  notes: string;
}

export interface SubjectCode {
  id: number;
  code: string;
  full_name: string;
  category: string;
  is_active: boolean;
}

export interface TimetableEntry {
  id: number;
  academic_term: number;
  day_of_week: number;
  day_name: string;
  tiered_period: number;
  period_name: string;
  period_sequence: number;
  period_start: string;
  period_end: string;
  year_group: number;
  year_group_name: string;
  teacher: number;
  teacher_name: string;
  subject: number;
  subject_code: string;
  subject_name: string;
  subject_category: string;
  room: number | null;
  room_detail: Room | null;
  is_practical: boolean;
  practical_rooms: string;
  raw_cell_code: string;
}

export interface TimetableEntryWrite {
  academic_term: number;
  day_of_week: number;
  tiered_period: number;
  year_group: number;
  teacher: number;
  subject: number;
  room?: number | null;
  is_practical?: boolean;
  practical_rooms?: string;
  raw_cell_code?: string;
}

export interface WeekViewResponse {
  monday: TimetableEntry[];
  tuesday: TimetableEntry[];
  wednesday: TimetableEntry[];
  thursday: TimetableEntry[];
  friday: TimetableEntry[];
}

export interface YearGroup {
  id: number;
  name: string;
  year_level: number;
  year_level_name: string;
  class_teacher: number | null;
  class_teacher_name: string;
  room_number: string;
  capacity: number;
}

export interface YearLevel {
  id: number;
  name: string;
  order: number;
}

export interface AcademicTerm {
  id: number;
  name: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Academics Module Models
 */

export interface Classroom {
  id: number;
  name: string;
  year_level_name: string;
  room_number: string;
  capacity: number;
  current_enrollment: number;
  class_teacher: {
    school_id: string;
    full_name: string;
  };
  is_active: boolean;
}

export interface BulkPromotionRequest {
  source_year_level: number;
  target_year_level: number;
  academic_year: string;
  student_ids: number[];
}

export interface YearLevel {
  id: number;
  name: string;
  order: number;
  is_active: boolean;
}

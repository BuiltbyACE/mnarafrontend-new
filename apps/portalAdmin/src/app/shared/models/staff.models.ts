/**
 * Staff & HR Module Models
 */

export interface Faculty {
  id: number;
  staff_profile: StaffProfile;
  surname: string;
  other_names: string;
  full_name?: string; // Computed
  national_id: string;
  kra_pin: string;
  nssf_number: string;
  teacher_data?: TeacherData;
  is_teacher: boolean;
}

export interface StaffProfile {
  school_id: string;
  email: string;
  is_active: boolean;
  totp_enrolled_at: string | null;
  last_login?: string;
}

export interface TeacherData {
  tsc_number: string;
  specialization_area: string;
  subjects_taught?: string[];
}

export interface StaffFormData {
  email: string;
  first_name: string;
  last_name: string;
  national_id: string;
  kra_pin: string;
  nssf_number: string;
  is_teacher: boolean;
  tsc_number?: string;
  specialization_area?: string;
}

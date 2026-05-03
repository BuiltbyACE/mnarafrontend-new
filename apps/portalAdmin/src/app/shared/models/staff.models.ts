/**
 * Staff & HR Module Models
 */

export interface Faculty {
  id: number;
  staff_profile: StaffProfile;
  surname: string;
  other_names: string;
  full_name?: string; // Computed
  employee_id?: string; // e.g. TCH-001
  national_id: string;
  kra_pin: string;
  nssf_number: string;
  role_display?: string;
  department?: string;
  employment_type?: 'FULLTIME' | 'PARTTIME' | 'CONTRACT';
  employment_type_display?: string;
  qualification_level?: string;
  specialization_area?: string;
  teacher_data?: TeacherData;
  is_teacher: boolean;
  is_active?: boolean;
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

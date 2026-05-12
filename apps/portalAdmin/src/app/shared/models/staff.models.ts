// /**
//  * Staff & HR Module Models
//  */

// export interface Faculty {
//   id: number;
//   staff_profile: StaffProfile;
//   surname: string;
//   other_names: string;
//   full_name?: string; // Computed
//   employee_id?: string; // e.g. TCH-001
//   national_id: string;
//   kra_pin: string;
//   nssf_number: string;
//   role_display?: string;
//   designation?: string; // Job title/role
//   department?: string;
//   department_name?: string; // Readable department name from API
//   employment_type?: 'FULLTIME' | 'PARTTIME' | 'CONTRACT';
//   employment_type_display?: string;
//   qualification_level?: string;
//   specialization_area?: string;
//   teacher_data?: TeacherData;
//   is_teacher: boolean;
//   is_active?: boolean;
//   base_salary?: number; // For payroll calculation
// }

// export interface StaffProfile {
//   school_id: string;
//   email: string;
//   is_active: boolean;
//   totp_enrolled_at: string | null;
//   last_login?: string;
// }

// export interface TeacherData {
//   tsc_number: string;
//   specialization_area: string;
//   subjects_taught?: string[];
// }

// export interface StaffFormData {
//   email: string;
//   first_name: string;
//   last_name: string;
//   national_id: string;
//   kra_pin: string;
//   nssf_number: string;
//   is_teacher: boolean;
//   tsc_number?: string;
//   specialization_area?: string;
// }









/**
 * Staff & HR Module Models
 */

export interface TeacherProfile {
  id: number;
  tsc_number: string;
  highest_degree: string;
  teaching_subjects: string[];
}

export interface Faculty {
  id: number;
  school_id: string;
  first_name: string;
  last_name: string;
  surname: string;
  other_names: string;
  full_name: string; 
  national_id: string;
  kra_pin: string;
  nssf_number?: string;
  department_name: string;
  user_role: string;
  employment_type?: string;
  qualification_level: string;
  specialization_area: string;
  teacher_profile?: TeacherProfile;
  is_active: boolean;
  base_salary?: number; // For payroll calculation
}

export interface StaffProfile {
  school_id: string;
  email: string;
  is_active: boolean;
  totp_enrolled_at: string | null;
  last_login?: string;
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

export interface LeaveRequest {
  id: number;
  staff_name: string;
  leave_type: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'COMPASSIONATE' | 'STUDY';
  leave_type_display: string;
  start_date: string;
  end_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  status_display: string;
  reason?: string;
  staff: number;
  created_at: string;
}

export interface LeaveBalance {
  id: number;
  staff: number;
  staff_name?: string;
  points_remaining: number;
}
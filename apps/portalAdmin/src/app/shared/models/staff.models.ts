export type StaffCategory = 'TEACHING' | 'NON_TEACHING';
export type StaffRole = 'TEACHER' | 'STAFF' | 'FINANCE' | 'ADMIN' | 'SUPPORT_STAFF';
export type QualificationLevel = 'DIPLOMA' | 'DEGREE' | 'MASTERS' | 'PHD' | 'OTHER';
export type LeaveType = 'MATERNITY' | 'SICK' | 'COMPASSIONATE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TeacherProfile {
  id: number;
  tsc_number: string;
  highest_degree: string;
  teaching_subjects: string[];
}

export interface StaffSalary {
  base_pay: number;
  house_allowance: number;
  commuter_allowance: number;
  total_allowances: number;
  gross_pay: number;
}

export interface StaffLeaveBalance {
  points_remaining: number;
  maternity_days_entitled?: number;
  maternity_days_remaining?: number;
  sick_days_remaining?: number | null;
}

export interface Faculty {
  id: number;
  school_id: string;
  first_name: string;
  last_name: string;
  surname?: string;
  other_names?: string;
  full_name: string;
  department: string;
  department_name: string;
  staff_category: StaffCategory;
  role: string;
  user_role?: string;
  system_role_name?: string;
  is_active: boolean;
  email?: string;
  phone?: string;
  hire_date: string;
  national_id?: string;
  kra_pin?: string;
  nssf_number?: string;
  nhif_number?: string;
  qualification: string;
  qualification_level?: string;
  specialization: string;
  specialization_area?: string;
  teaching_subjects: string[];
  tsc_number?: string;
  highest_degree?: string;
  photo_url?: string;
  salary?: StaffSalary;
  leave_balance?: StaffLeaveBalance;
  base_salary?: number;
  teacher_profile?: TeacherProfile;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  school_id: string;
  email: string;
  is_active: boolean;
  totp_enrolled_at: string | null;
  last_login?: string;
}

export interface StaffProfileMe {
  name: string;
  employee_id: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  hire_date: string;
  photo_url: string | null;
  national_id: string;
  kra_pin: string;
  qualification_level: string;
  specialization_area: string;
  surname: string;
  other_names: string;
  tsc_number: string;
  highest_degree: string;
  teaching_subjects: string[];
  leave_balance: StaffLeaveBalance | null;
}

export interface StaffFormData {
  first_name: string;
  last_name: string;
  national_id: string;
  kra_pin: string;
  staff_role: StaffRole;
  email?: string;
  phone?: string;
  nssf_number?: string;
  nhif_number?: string;
  department?: string;
  surname?: string;
  other_names?: string;
  gender?: string;
  qualification_level?: QualificationLevel;
  specialization_area?: string;
  tsc_number?: string;
  highest_degree?: string;
  teaching_subjects?: string[];
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  hod?: string;
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
  department?: string;
}

export interface LeaveRequest {
  id: number;
  staff_name: string;
  leave_type: LeaveType;
  leave_type_display: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
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
  maternity_days_entitled?: number;
  maternity_days_remaining?: number;
  sick_days_remaining?: number | null;
}

export interface LeadershipRoles {
  is_hod: boolean;
  hod_department?: string;
  is_coordinator: boolean;
  coordinator_key_stage?: string;
  is_class_teacher: boolean;
  class_teacher_of?: string;
}

export interface LatestPayslip {
  month: number;
  year: number;
  gross_pay: number;
  paye: number;
  nhif: number;
  nssf: number;
  net_pay: number;
  is_paid: boolean;
}

export interface StaffDetailResponse extends Faculty {
  leadership_roles?: LeadershipRoles;
  assignments?: any[];
  latest_payslip?: LatestPayslip;
}

export interface DepartmentGroup {
  department: string;
  members: Faculty[];
}

export interface DirectoryResponse {
  teaching_staff: DepartmentGroup[];
  non_teaching_staff: DepartmentGroup[];
}

export interface DirectorySummaryItem {
  name?: string;
  role?: string;
  count: number;
}

export interface DirectorySummary {
  total_staff: number;
  teaching: number;
  non_teaching: number;
  by_department: DirectorySummaryItem[];
  by_role: DirectorySummaryItem[];
}

export interface PayrollSummary {
  total_staff: number;
  total_payroll: number;
  departments: number;
  on_leave: number;
  employees: any[];
  department_breakdown: DepartmentBreakdownItem[];
}

export interface DepartmentBreakdownItem {
  name: string;
  count: number;
  payroll: number;
}

export interface MyRole {
  type: string;
  display: string;
  context: string;
}

export interface MyRolesResponse {
  roles: MyRole[];
  primary_class: string | null;
  department: { id: number; name: string; is_hod: boolean } | null;
}

export interface StaffSettings {
  preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
  };
}

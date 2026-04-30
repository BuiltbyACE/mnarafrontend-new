/**
 * Students & Admissions Module Models
 */

export interface Admission {
  id: number;
  admission_number: string;
  student: StudentSummary;
  student_name: string; // Computed from student.first_name + student.last_name
  year_level_name: string;
  year_level: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';
  application_date: string;
  current_class: string;
  date_of_admission: string;
  is_active: boolean;
}

export interface StudentSummary {
  school_id: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Computed
}

export interface StudentDetail {
  id: number;
  school_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  current_class: string;
  admission_date: string;
  is_active: boolean;
}

export interface CarerData {
  carer_level: 'PRIMARY' | 'SECONDARY';
  relationship: string;
  first_name: string;
  surname: string;
  email: string;
  mobile_1: string;
  mobile_2?: string;
}

export interface AdmissionRequest {
  admission_number?: string;
  student: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'M' | 'F' | 'O';
  };
  carers_data: CarerData[];
  year_level_id: number;
}

export interface MedicalRecord {
  student_id: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact: string;
  doctor_name: string;
  hospital_preference: string;
}

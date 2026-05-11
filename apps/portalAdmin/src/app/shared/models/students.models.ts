


export interface Admission {
  id: number;
  student_first_name: string;
  student_last_name: string;
  student_school_id: string;
  class_sought_name: string;
  date_of_admission: string;
  gender: string;
  nationality: string;
  resident: string;
  religion: string;
  transport_options: string;
  lunch_option: boolean;
  medical_record?: {
    status: string;
    last_updated: string;
  };
  status: string; // From your backend logic
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

export interface StudentAdmissionRecord {
  id: number;
  gender: string;
  nationality: string | null;
  date_of_admission: string;
  current_class: number | null;
  class_sought: number | null;
  photo_url: string | null;
  carers: string[];
  medical_record: { status: string; last_updated?: string } | null;
  regular_details: {
    school_name: string;
    curriculum: string;
  } | null;
}

export interface StudentEnrollment {
  id: number;
  student_name: string;
  academic_year_name: string;
  classroom_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'PROMOTED';
  promotion_notes: string | null;
  student: number;
  academic_year: number;
  classroom: number;
}

// apps/portalAdmin/src/app/core/models/student.model.ts

export interface SiblingMinimal {
  id: string; // Or number, depending on whether we use UUIDs or AutoFields
  full_name: string;
  class_name: string;
}

// export interface StudentProfile {
//   id: string;
//   first_name: string;
//   last_name: string;
//   date_of_birth: string;
//   enrollment_date: string;
  
//   // Flattened User Data
//   user_school_id: string;
//   user_role: string;
  
//   // Nested Relational Objects
//   // (Use optional chaining ? because these can technically be null if incomplete)
//   admission_record?: Admission; 
//   medical_record?: MedicalRecord;     
//   enrollments: StudentEnrollment;          
  
//   // Computed & Method Fields
//   siblings: SiblingMinimal[];
//   category?: string | null;
//   category_name?: string;
//   gender: string; // The backend guarantees this defaults to '' if missing
//   current_class_name: string;
  
//   // House System
//   house_id?: string | null;
//   house_name?: string;
// }


export interface StudentProfile {
  id: number; // [CRITICAL FIX]: Must be a number, not string
  first_name: string;
  last_name: string;
  date_of_birth: string;
  enrollment_date: string;
  
  user_school_id: string;
  user_role: string;
  
  // [CRITICAL FIX]: Use StudentAdmissionRecord instead of Admission
  admission_record?: StudentAdmissionRecord; 
  medical_record?: MedicalRecord;     
  enrollments: StudentEnrollment[];          
  
  siblings: SiblingMinimal[];
  category?: string | null;
  category_name?: string;
  gender: string; 
  current_class_name: string;
  
  house_id?: string | null;
  house_name?: string;

  // [CRITICAL FIX]: UI State Property for the promotion wizard
  assigned_course_id?: number | string; 
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

export interface StudentCategory {
  id: string;
  name: string;
  description: string;
  student_count?: number;
  is_active: boolean;
}

export interface StudentHouse {
  id: string;
  name: string;
  color_hex: string;
  head_of_house_name?: string;
  head_of_house_id?: string;
  current_points: number;
  student_count: number;
  is_active: boolean;
}


// export interface YearLevel {
//   id: number;
//   name: string;
//   key_stage_name: string;
//   order: number;
// }
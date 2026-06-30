export type PathwayType = 'REGULAR_SCHOOL' | 'REGULAR_SCHOOL_INTERRUPTED' | 'HOMESCHOOL' | 'NONE';

export type PreviousSchoolNature = 'REGULAR' | 'REGULAR_INTERRUPT' | 'HOMESCHOOL' | 'NONE';

export const PATHWAY_TO_NATURE: Record<PathwayType, PreviousSchoolNature> = {
  REGULAR_SCHOOL: 'REGULAR',
  REGULAR_SCHOOL_INTERRUPTED: 'REGULAR_INTERRUPT',
  HOMESCHOOL: 'HOMESCHOOL',
  NONE: 'NONE',
};

export const NATURE_TO_PATHWAY: Record<PreviousSchoolNature, PathwayType> = {
  REGULAR: 'REGULAR_SCHOOL',
  REGULAR_INTERRUPT: 'REGULAR_SCHOOL_INTERRUPTED',
  HOMESCHOOL: 'HOMESCHOOL',
  NONE: 'NONE',
};

export type Gender = 'MALE' | 'FEMALE';
export type CarerLevel = 'PRIMARY' | 'SECONDARY';
export type CommitmentStatus = 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED';

export interface RegularSchoolDetails {
  school_name: string;
  curriculum: string;
  transfer_reason?: string;
  previous_reports?: boolean;
  last_attended_class?: string;
  last_attended_year?: string;
  start_year?: number;
  end_year?: number;
}

export interface RegularSchoolInterruptDetails extends RegularSchoolDetails {
  interruption_start: string;
  interruption_end: string;
  interruption_reason: string;
}

export interface HomeschoolDetails {
  supervisor_name: string;
  supervisor_qualification: string;
  supervisor_contact: string;
  content_covered: string[];
  subjects: HomeschoolSubject[];
  start_year?: number;
  end_year?: number;
}

export interface HomeschoolSubject {
  subject_name: string;
  level_achieved: string;
  years_studied: number;
}

export interface NoneEducationDetails {
  language_competency: 'ENGLISH' | 'KISWAHILI' | 'ARABIC' | 'OTHER';
  other_language?: string;
}

export interface ArabicQuranData {
  arabic_reading_fluency: 'GOOD' | 'AVERAGE' | 'POOR';
  arabic_writing_fluency: 'GOOD' | 'AVERAGE' | 'POOR';
  arabic_speaking_fluency: 'GOOD' | 'AVERAGE' | 'POOR';
  reading_al_quran: 'GOOD' | 'AVERAGE' | 'POOR';
  memorization_of_al_quran: string[];
}

export type MedicalConditionKey =
  | 'ASTHMA' | 'DIABETES' | 'EPILEPSY' | 'HEARING_IMPAIRMENT'
  | 'VISUAL_IMPAIRMENT' | 'SPEECH_IMPEDIMENT' | 'MOBILITY_IMPAIRMENT'
  | 'ADHD' | 'AUTISM_SPECTRUM' | 'DYSLEXIA' | 'DYSCALCULIA'
  | 'DYSPRAXIA' | 'FOOD_ALLERGY' | 'DRUG_ALLERGY' | 'LATEX_ALLERGY'
  | 'INSECT_ALLERGY' | 'OTHER_ALLERGY' | 'HEART_CONDITION'
  | 'KIDNEY_CONDITION' | 'LIVER_CONDITION' | 'BLOOD_DISORDER'
  | 'MENTAL_HEALTH' | 'SKIN_CONDITION' | 'THYROID_CONDITION'
  | 'MIGRAINE' | 'ANEMIA' | 'OTHER_CHRONIC';

export const CONDITION_LABELS: Record<MedicalConditionKey, string> = {
  ASTHMA: 'Asthma',
  DIABETES: 'Diabetes',
  EPILEPSY: 'Epilepsy',
  HEARING_IMPAIRMENT: 'Hearing Impairment',
  VISUAL_IMPAIRMENT: 'Visual Impairment',
  SPEECH_IMPEDIMENT: 'Speech Impediment',
  MOBILITY_IMPAIRMENT: 'Mobility Impairment',
  ADHD: 'ADHD',
  AUTISM_SPECTRUM: 'Autism Spectrum',
  DYSLEXIA: 'Dyslexia',
  DYSCALCULIA: 'Dyscalculia',
  DYSPRAXIA: 'Dyspraxia',
  FOOD_ALLERGY: 'Food Allergy',
  DRUG_ALLERGY: 'Drug Allergy',
  LATEX_ALLERGY: 'Latex Allergy',
  INSECT_ALLERGY: 'Insect Allergy',
  OTHER_ALLERGY: 'Other Allergy',
  HEART_CONDITION: 'Heart Condition',
  KIDNEY_CONDITION: 'Kidney Condition',
  LIVER_CONDITION: 'Liver Condition',
  BLOOD_DISORDER: 'Blood Disorder',
  MENTAL_HEALTH: 'Mental Health',
  SKIN_CONDITION: 'Skin Condition',
  THYROID_CONDITION: 'Thyroid Condition',
  MIGRAINE: 'Migraine',
  ANEMIA: 'Anemia',
  OTHER_CHRONIC: 'Other Chronic Condition',
};

export const MEDICAL_CONDITIONS: MedicalConditionKey[] = Object.keys(CONDITION_LABELS) as MedicalConditionKey[];

export interface MedicalRecord {
  emergency_facility: string;
  physician_name: string;
  physician_office: string;
  physician_mobile: string;
  physician_email: string;
  has_insurance: boolean;
  insurance_provider: string;
  insurance_policy_no: string;
  insurance_mobile: string;
  imm_mmr: boolean;
  imm_tdap: boolean;
  imm_varicella: boolean;
  imm_polio: boolean;
  imm_meningococcal: boolean;
  imm_hepatitis_b: boolean;
  imm_bcg: boolean;
  allergies: string;
  chronic_illnesses: string;
  daily_medications: string;
  physical_limitations: string;
  visual_hearing_impairments: string;
  conditions_history: string[];
  conditions_detail: Record<MedicalConditionKey, boolean>;
  conditions_elaboration: string;
  wears_dental_braces: boolean;
  declaration_signed: boolean;
}

export interface SubjectExclusionData {
  excluded_subjects: string[];
}

export interface SubjectSelectionData {
  compulsory_ids: number[];
  selected_optional_ids: number[];
}

export const COMPULSORY_SUBJECTS = ['Arabic', 'Arabic Compulsory Language'];

export interface CarerData {
  carer_level: CarerLevel;
  relationship: string;
  title: string;
  first_name: string;
  surname: string;
  email: string;
  mobile_1: string;
  mobile_2?: string;
  nationality: string;
  national_id: string;
  passport_number: string;
  occupation: string;
  employer: string;
  address: string;
}

export interface FamilyBackground {
  family_type: 'SINGLE_PARENT' | 'DIVORCE' | 'LEGAL_CUSTODIAN' | 'CO_PARENTS';
  different_home_address: boolean;
  estate: string;
  apartment: string;
  road: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

export interface SiblingFormEntry {
  full_name: string;
  year_of_admission: number;
  class_name: string;
  relationship: string;
}

export interface AdmissionRecord {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  religion: string;
  nationality: string;
  residence: string;
  date_of_admission: string;
  year_level_id: number;
  year_level_name: string;
  pathway: PathwayType;
  regular_details: RegularSchoolDetails | RegularSchoolInterruptDetails | null;
  homeschool_details: HomeschoolDetails | null;
  none_education_details: NoneEducationDetails | null;
  arabic_quran_data: ArabicQuranData | null;
  subject_selection_data: SubjectSelectionData | null;
  medical_record: MedicalRecord | null;
  carers: CarerData[];
  family_background: FamilyBackground | null;
  siblings: SiblingFormEntry[];
  commitment_status: CommitmentStatus;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdmissionChoices {
  gender?: { value: string; label: string }[];
  embrace_islamic?: { value: string; label: string }[];
  transport_options?: { value: string; label: string }[];
  previous_school_nature?: { value: string; label: string }[];
  medical_conditions?: { value: string; label: string }[];
}

export interface AdmissionCreatePayload {
  student: number;
  class_sought: number;
  gender: string;
  previous_school_nature: PreviousSchoolNature;
  regular_details?: RegularSchoolDetails | RegularSchoolInterruptDetails;
  interrupt_details?: RegularSchoolInterruptDetails;
  homeschool_details?: HomeschoolDetails;
  none_details?: NoneEducationDetails;
  medical_record?: MedicalRecord;
  subject_selection_data?: SubjectSelectionData;
  arabic_quran_data?: ArabicQuranData;
  carers_data?: CarerData[];
  family_background?: FamilyBackground;
  sibling_entries?: SiblingFormEntry[];

  resident?: string;
  home_address?: string;
  emergency_contact_email?: string;
  emergency_contact_phone?: string;
  middle_name?: string;
  other_names?: string;
  nationality?: string;
  religion?: string;
  mother_tongue?: string;
  transport_options?: string;
  lunch_option?: boolean;
  embrace_islamic?: string;
  date_of_admission?: string;
  photo_url?: string;
}

export interface CreateStudentProfilePayload {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  school_id?: string;
}

export interface EnrollmentPayload {
  student: number;
  classroom: number;
  academic_year: number;
}

export interface BehaviourCommitment {
  id: number;
  admission: number;
  understands_rules: boolean;
  respects_staff: boolean;
  attends_regularly: boolean;
  completes_homework: boolean;
  follows_dress_code: boolean;
  no_bullying: boolean;
  no_vandalism: boolean;
  no_substance_abuse: boolean;
  responsible_online: boolean;
  maintains_cleanliness: boolean;
  participates_activities: boolean;
  cares_facilities: boolean;
  respect_diversity: boolean;
  follows_safety: boolean;
  honest_communication: boolean;
  positive_behavior: boolean;
  student_name: string;
  parent_name: string;
  date_signed: string;
  is_signed: boolean;
  created_at: string;
}

export interface BehaviourCommitmentPayload {
  understands_rules: boolean;
  respects_staff: boolean;
  attends_regularly: boolean;
  completes_homework: boolean;
  follows_dress_code: boolean;
  no_bullying: boolean;
  no_vandalism: boolean;
  no_substance_abuse: boolean;
  responsible_online: boolean;
  maintains_cleanliness: boolean;
  participates_activities: boolean;
  cares_facilities: boolean;
  respect_diversity: boolean;
  follows_safety: boolean;
  honest_communication: boolean;
  positive_behavior: boolean;
  student_name: string;
  parent_name: string;
  date_signed: string;
}

export interface Admission {
  id: number;
  admission_number: string;
  student_first_name: string;
  student_last_name: string;
  student_school_id: string;
  class_sought_name: string;
  date_of_admission: string;
  gender: string;
  nationality: string;
  resident: string;
  religion: string;
  residence?: string;
  pathway: PathwayType;
  previous_school_nature: PreviousSchoolNature;
  transport_options: string;
  lunch_option: boolean;
  medical_record?: { status: string; last_updated?: string } | null;
  status: string;
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

export interface StudentSummary {
  school_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
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

export interface StudentAdmissionRecord {
  id: number;
  gender: string;
  nationality: string | null;
  residence: string | null;
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
  status: 'ACTIVE' | 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED';
  promotion_notes: string | null;
  student: number;
  academic_year: number;
  classroom: number;
  transfer_date: string | null;
  destination_school: string | null;
  transfer_reason: string | null;
}

export interface CarerLookupResponse {
  found: boolean;
  carer?: CarerData;
  students?: {
    id: number;
    school_id: string;
    first_name: string;
    last_name: string;
    year_level: string | null;
  }[];
  message?: string;
}

export interface SiblingMinimal {
  id: string;
  full_name: string;
  class_name: string;
}

export interface StudentProfile {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  enrollment_date: string;
  user_school_id: string;
  user_role: string;
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
  assigned_course_id?: number | string;
  registered_subjects?: { id: number; name: string; code?: string }[];
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

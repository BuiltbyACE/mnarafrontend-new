export type PathwayType = 'REGULAR_SCHOOL' | 'REGULAR_SCHOOL_INTERRUPTED' | 'HOMESCHOOL' | 'NONE';
export type Gender = 'M' | 'F' | 'O';
export type CarerLevel = 'PRIMARY' | 'SECONDARY';
export type CommitmentStatus = 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED';

export interface RegularSchoolDetails {
  school_name: string;
  curriculum: string;
  transfer_reason: string;
  previous_reports: boolean;
  last_attended_class: string;
  last_attended_year: string;
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
  content_covered: string;
  subjects: HomeschoolSubject[];
}

export interface HomeschoolSubject {
  subject_name: string;
  level_achieved: string;
  years_studied: number;
}

export interface NoneEducationDetails {
  reason: string;
  alternative_arrangement: string;
}

export interface ArabicQuranData {
  arabic_proficiency: 'NONE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'FLUENT';
  quran_memorization: string;
  quran_reading_level: 'NONE' | 'BASIC' | 'MODERATE' | 'FLUENT';
  tajweed_level: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  comments: string;
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
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact: string;
  doctor_name: string;
  doctor_contact: string;
  hospital_preference: string;
  immunization_uptodate: boolean;
  immunization_notes: string;
  conditions_detail: Record<MedicalConditionKey, boolean>;
  additional_notes: string;
}

export interface SubjectExclusionData {
  excluded_subjects: string[];
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
  id_type?: string;
  id_number?: string;
  nationality: string;
  occupation: string;
  employer: string;
  address: string;
}

export interface FamilyBackground {
  marital_status: 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'SINGLE';
  number_of_siblings: number;
  student_position: number;
  languages_spoken_at_home: string[];
  economic_status: 'LOW' | 'MIDDLE' | 'HIGH';
  living_with: string;
}

export interface SiblingFormEntry {
  full_name: string;
  date_of_birth: string;
  class_name: string;
  school_name: string;
  notes: string;
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
  subject_exclusions: SubjectExclusionData | null;
  medical_record: MedicalRecord | null;
  carers: CarerData[];
  family_background: FamilyBackground | null;
  siblings: SiblingFormEntry[];
  commitment_status: CommitmentStatus;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdmissionCreatePayload {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  religion: string;
  nationality: string;
  residence: string;
  year_level_id: number;
  date_of_admission: string;
  pathway: PathwayType;
  regular_details?: RegularSchoolDetails | RegularSchoolInterruptDetails;
  homeschool_details?: HomeschoolDetails;
  none_education_details?: NoneEducationDetails;
  arabic_quran_data?: ArabicQuranData;
  subject_exclusions?: SubjectExclusionData;
  medical_record: MedicalRecord;
  carers: CarerData[];
  family_background?: FamilyBackground;
  siblings: SiblingFormEntry[];
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
  pathway?: PathwayType;
  commitment_status?: CommitmentStatus;
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

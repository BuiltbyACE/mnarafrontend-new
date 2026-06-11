import { Timestamp } from 'rxjs';

// ─── Dashboard ───────────────────────────────────────────────────
export interface SafetyStatus {
  status: 'ON_CAMPUS' | 'OFF_CAMPUS';
  message: string;
  timestamp: string;
  color_code: 'success' | 'danger';
}

export interface SiblingStudent {
  id: number;
  student_name: string;
}

export interface FinancialSnapshot {
  term_balance: number;
  currency: string;
  next_due_date: string | null;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
}

export interface RecentAcademic {
  subject: string;
  assessment: string;
  score: string;
  grade: string;
}

export interface UrgentNotice {
  id: number;
  title: string;
  date: string;
  is_urgent: boolean;
}

export interface TransportSnapshot {
  status: string;
  message: string;
  color_code: string;
}

export interface DashboardSummary {
  student_name: string;
  sibling_students: SiblingStudent[];
  safety_status: SafetyStatus;
  financial_snapshot: FinancialSnapshot;
  recent_academics: RecentAcademic[];
  urgent_notices: UrgentNotice[];
  transport_snapshot?: TransportSnapshot;
}

// ─── Timetable ────────────────────────────────────────────────────
export interface TimetableEntry {
  day: string;
  period: number;
  subject: string;
  teacher: string;
  classroom: string;
  start_time: string;
  end_time: string;
}

export interface ReportCardSubjectRow {
  id: number;
  subject_name: string;
  teacher_name: string;
  cfa_score: number | null;
  cfa_grade: string;
  tee_score: number | null;
  tee_grade: string;
  average_score: number | null;
  average_grade: string;
  subject_teacher_remarks: string;
}

export interface ReportCardSocialConduct {
  id: number;
  completes_assignments: number | null;
  makes_good_use_of_time: number | null;
  does_work_keenly: number | null;
  follows_directions: number | null;
  pays_attention: number | null;
  shows_courtesy: number | null;
  emotional_intelligence: number | null;
  grooming: number | null;
}

export interface ReportCardCoCurricular {
  id: number;
  sports_and_games: string;
  responsibilities_held: string;
  achievements: string;
  life_skill_club: string;
}

export interface TermReportCard {
  id: number;
  student: number;
  student_name: string;
  student_adm_no: string;
  student_dob: string;
  student_photo: string | null;
  term: number;
  term_name: string;
  total_score: number | null;
  average_percentage: number | null;
  overall_grade: string;
  class_teacher_remarks: string;
  principal_remarks: string;
  is_published: boolean;
  attendance_present: number | null;
  attendance_out_of: number | null;
  next_term_opening_date: string | null;
  next_term_midterm_dates: string;
  next_term_closing_date: string | null;
  
  subject_rows: ReportCardSubjectRow[];
  social_conduct: ReportCardSocialConduct | null;
  co_curricular: ReportCardCoCurricular | null;
}

export interface PrintableReportCardResponse {
  report_card: TermReportCard;
  school_info: SchoolInfo;
  generated_at: string;
}

// ─── Finance ──────────────────────────────────────────────────────
export interface FeeCategoryItem {
  category: string;
  amount: number;
  frequency: string;
  description: string;
}

export interface FeeStructureChild {
  student_id: number;
  student_name: string;
  class_name: string;
  year_level: string;
  term: string;
  academic_year: string;
  total_fee: number;
  fee_categories: FeeCategoryItem[];
}

export interface FeeStructureResponse {
  children: FeeStructureChild[];
}

export interface SchoolInfo {
  name: string;
  postal_address: string;
  email: string;
  phone: string;
  logo: string | null;
}

export interface FeeStructurePdfResponse {
  children: FeeStructureChild[];
  grand_total: number;
  school_info: SchoolInfo;
  generated_at: string;
}

export interface StudentInvoice {
  id: number;
  student: number;
  student_name: string;
  student_school_id: string;
  fee_structure: number;
  fee_title: string;
  amount_due: number;
  amount_paid: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERPAID' | 'CANCELLED' | 'WRITTEN_OFF' | 'REFUNDED';
}

export interface Transaction {
  id: number;
  invoice: number;
  student_name: string;
  amount: number;
  payment_method: string;
  reference_code: string;
  transaction_date: string;
}

export interface FeeBalance {
  student: number;
  student_name: string;
  total_due: number;
  total_paid: number;
  balance: number;
}

// ─── Fee Statement ────────────────────────────────────────────────
export interface FinancialSummary {
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  currency: string;
}

export interface FeeStatementInvoice {
  id: number;
  fee_category: string | null;
  academic_year: string | null;
  term: string | null;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

export interface FeeStatementPayment {
  id: number;
  amount: number;
  payment_method: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE';
  reference_code: string;
  transaction_date: string | null;
}

export interface FeeStatementChild {
  student_id: number;
  student_name: string;
  school_id: string | null;
  class_name: string | null;
  year_level: string | null;
  enrollment_status: string | null;
  financial_summary: FinancialSummary;
  invoices: FeeStatementInvoice[];
  recent_payments: FeeStatementPayment[];
}

export interface FeeStatementResponse {
  children: FeeStatementChild[];
  school_info: SchoolInfo;
  generated_at: string;
}

export interface StkPushRequest {
  phone: string;
  invoice_ids: number[];
}

export interface StkPushResponse {
  CheckoutRequestID: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  amount: number;
  phone: string;
}

// ─── Announcements ────────────────────────────────────────────────
export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: 'URGENT' | 'GENERAL' | 'EVENT' | 'ACADEMIC';
  audience: string[];
  pinned: boolean;
  published_at: string;
}

// ─── Transport ────────────────────────────────────────────────────
export interface Trip {
  id: number;
  route_name: string;
  driver_name: string;
  departure_time: string;
  date: string;
}

export interface Manifest {
  id: number;
  student_name: string;
  stop_name: string;
  trip_date: string;
}

export interface RouteStop {
  id: number;
  route: number;
  name: string;
  order: number;
  latitude: string;
  longitude: string;
  estimated_arrival_offset: string;
}

export interface TransportRoute {
  id: number;
  name: string;
  is_active: boolean;
  stops: RouteStop[];
}

export interface FleetTelemetry {
  id?: number;
  fleet_id?: string;
  trip?: string;
  vehicle_id?: number;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  timestamp?: string;
  driver_name?: string;
  route_name?: string;
  passenger_count?: number;
  status?: 'ON_ROUTE' | 'DELAYED' | 'STOPPED' | 'IN_TRANSIT' | 'IDLE';
  registration_number?: string;
}

// ─── Status Helpers ────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  PAID: '#059669',
  PARTIAL: '#d97706',
  PENDING: '#e11d48',
  OVERPAID: '#2563eb',
  CANCELLED: '#94a3b8',
  WRITTEN_OFF: '#94a3b8',
  REFUNDED: '#94a3b8',
  PRESENT: '#059669',
  ABSENT: '#e11d48',
  LATE: '#d97706',
  EXCUSED: '#6366f1',
  HOLIDAY: '#94a3b8',
  ON_CAMPUS: '#059669',
  OFF_CAMPUS: '#e11d48',
  COMMENDATION: '#059669',
  INCIDENT: '#e11d48',
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  MPESA: 'M-Pesa',
  BANK: 'Bank Transfer',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
};

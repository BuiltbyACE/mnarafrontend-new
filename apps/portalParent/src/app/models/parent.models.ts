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

export interface DashboardSummary {
  student_name: string;
  sibling_students: SiblingStudent[];
  safety_status: SafetyStatus;
  financial_snapshot: FinancialSnapshot;
  recent_academics: RecentAcademic[];
  urgent_notices: UrgentNotice[];
}

// ─── Students / Profiles ─────────────────────────────────────────
export interface SiblingProfile {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  enrollment_date?: string;
  user_school_id: string;
  is_active: boolean;
  current_class_name: string;
  category_name?: string;
  house_name?: string;
  gender?: string;
  attendance_percentage?: number;
  overall_performance?: number;
  subjects?: string[];
  siblings?: { id: number; full_name: string; class_name: string }[];
  parent_name?: string;
  parent_contact?: string;
  parent_email?: string;
  address?: string;
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

// ─── Exam Results ─────────────────────────────────────────────────
export interface ExamResultEntry {
  id: number;
  component: number;
  component_name: string;
  exam_series: string;
  subject: string;
  raw_score: number;
  computed_grade: string;
  created_at: string;
}

// ─── Finance ──────────────────────────────────────────────────────
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

// ─── Behaviour ────────────────────────────────────────────────────
export interface BehaviourRecord {
  id: number;
  student_name: string;
  student_id: string;
  type: 'COMMENDATION' | 'INCIDENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  date: string;
  status: string;
  reported_by_name: string;
}

export interface BehaviourStats {
  total_records: number;
  commendations: number;
  incidents: number;
  pending_follow_ups: number;
}

export interface ChildListed {
  full_name: string;
  dob: string;
  year_group: string;
}

export interface BehaviourCommitment {
  id: number;
  parent_full_name: string;
  contact_mobile: string;
  contact_email: string;
  signed_date: string;
  commit_support_values: boolean;
  commit_discipline_at_home: boolean;
  decl_termination_clause: boolean;
  children_listed: ChildListed[];
  [key: string]: unknown;
}

export interface CommitmentCreateRequest {
  parent_full_name: string;
  contact_mobile: string;
  contact_email: string;
  commit_attend_meetings: boolean;
  commit_monitor_progress: boolean;
  commit_provide_resources: boolean;
  commit_communicate_concerns: boolean;
  commit_reinforce_school_rules: boolean;
  commit_support_values: boolean;
  commit_discipline_at_home: boolean;
  commit_encourage_reading: boolean;
  commit_limit_screen_time: boolean;
  commit_participate_activities: boolean;
  commit_ensure_punctuality: boolean;
  decl_termination_clause: boolean;
  decl_data_accuracy: boolean;
  decl_photo_consent: boolean;
  decl_medical_consent: boolean;
  decl_fee_obligation: boolean;
}

// ─── Notifications ────────────────────────────────────────────────
export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'URGENT';
  is_read: boolean;
  created_at: string;
}

export interface UnreadCount {
  count: number;
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

// ─── Attendance ───────────────────────────────────────────────────
export interface AttendanceRecord {
  student: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY';
  remarks: string;
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

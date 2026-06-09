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

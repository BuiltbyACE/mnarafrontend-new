export interface FeeStructure {
  id: number;
  academic_year: number;
  academic_year_name: string;
  term: number | null;
  year_level: number;
  year_level_name: string;
  amount: string;
  title: string;
}

export interface StudentInvoice {
  id: number;
  student: number;
  student_name: string;
  student_school_id: string;
  fee_structure: number;
  fee_title: string;
  amount_due: string;
  amount_paid: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

export interface PaymentTransaction {
  id: number;
  invoice: number;
  student_name: string;
  amount: string;
  payment_method: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE';
  reference_code: string;
  transaction_date: string;
  ledger_entries: LedgerEntryItem[];
}

export interface LedgerEntryItem {
  id: number;
  account_type: 'DEBIT' | 'CREDIT';
  amount: string;
  description: string;
  created_at: string;
}

export interface FullLedgerEntry {
  id: number;
  transaction_id: string;
  date: string;
  account: string;
  debit: string;
  credit: string;
  user: string;
  description: string;
}

export interface PurchaseRequisition {
  id: number;
  requested_by: number;
  requested_by_name: string;
  title: string;
  description: string;
  estimated_cost: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: string;
  category: 'FUEL' | 'UTILITY' | 'MAINTENANCE' | 'SUPPLIES' | 'OTHER';
  transaction_date: string;
  receipt_file: string | null;
  recorded_by: number;
  recorded_by_name: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  current_stock: number;
  minimum_threshold: number;
  unit_cost: string;
  location: string;
  last_verified: string | null;
  needs_restock: boolean;
  stock_movements: StockMovement[];
}

export interface StockMovement {
  id: number;
  item: number;
  item_name: string;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  remarks: string;
  recorded_by: number;
  recorded_by_name: string;
  created_at: string;
}

export interface SalaryStructure {
  id: number;
  staff: number;
  staff_name: string;
  base_pay: string;
  house_allowance: string;
  commuter_allowance: string;
  total_allowances: string;
  gross_pay: string;
}

export interface Payslip {
  id: number;
  staff: number;
  staff_name: string;
  month: number;
  year: number;
  gross_pay: string;
  paye_deduction: string;
  nhif_deduction: string;
  nssf_deduction: string;
  net_pay: string;
  is_paid: boolean;
  created_at: string;
}

export interface FinanceSummary {
  total_revenue: string;
  total_pending: string;
  total_expenses: string;
  outstanding_invoices: number;
}

export interface PrincipalDashboardData {
  fee_statistics: {
    total_invoiced: string;
    total_collected: string;
    outstanding_arrears: string;
    collection_percentage: string;
    current_term: string | null;
    academic_year: string | null;
  };
  expense_summary: { category: string; total: string }[];
  inventory_health: {
    total_value: string;
    total_items: number;
    low_stock_count: number;
    pending_verifications: number;
  };
  cash_flow: { month: string; revenue: string; expenses: string; net_income: string }[];
  recent_activity: { type: string; message: string; amount: string; timestamp: string }[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Student Finance Summary (from GET /finance/students/{id}/summary/) ───
export interface StudentFinanceSummary {
  student: StudentSummaryInfo;
  parents: ParentInfo[];
  siblings: SiblingInfo[];
  financial_summary: FinancialSummaryData;
  invoices: StudentFinanceInvoice[];
  recent_payments: StudentFinancePayment[];
  services: StudentServices;
}

export interface StudentSummaryInfo {
  id: number;
  first_name: string;
  last_name: string;
  school_id: string;
  current_class: string;
  year_level: string;
  enrollment_status: string;
  house: string;
  category: string;
}

export interface ParentInfo {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  relationship: string;
  carer_level: 'PRIMARY' | 'SECONDARY' | null;
}

export interface SiblingInfo {
  first_name: string;
  last_name: string;
  school_id: string;
  current_class: string | null;
  year_level: string | null;
  relationship: string;
}

export interface FinancialSummaryData {
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  current_term_balance: number;
  currency: string;
}

export interface StudentFinanceInvoice {
  id: number;
  fee_title: string;
  academic_year: string;
  term: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: string;
}

export interface StudentFinancePayment {
  id: number;
  amount: number;
  payment_method: string;
  reference_code: string;
  transaction_date: string;
}

export interface StudentServices {
  transport: string;
  lunch: boolean;
}

// ─── Student Profile (minimal, from /students/profiles/) ───
export interface StudentProfileMin {
  id: number;
  first_name: string;
  last_name: string;
  user_school_id: string;
  current_class_name: string;
  gender: string;
  house_name?: string;
  category_name?: string;
  enrollment_status?: string;
}

export const FORMAT_CURRENCY = (amount: string | number, currency = 'KES'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency} 0`;
  return `${currency} ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const STATUS_COLOR: Record<string, string> = {
  PENDING: '#d97706',
  PARTIAL: '#2563eb',
  PAID: '#059669',
  APPROVED: '#2563eb',
  REJECTED: '#e11d48',
  OVERDUE: '#e11d48',
  DISBURSED: '#059669',
  READY: '#059669',
  ACTIVE: '#059669',
  INACTIVE: '#94a3b8',
};

// ─── Staff Directory ───

export interface StaffSalary {
  base_pay: number;
  house_allowance: number;
  commuter_allowance: number;
  total_allowances: number;
  gross_pay: number;
}

export interface LeaveBalance {
  points_remaining: number;
}

export interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  school_id: string;
  department: string;
  staff_category: 'TEACHING' | 'NON_TEACHING';
  role: string;
  is_active: boolean;
  email: string | null;
  phone: string | null;
  hire_date: string | null;
  qualification: string | null;
  specialization: string | null;
  teaching_subjects: string[];
  photo_url: string | null;
  salary: StaffSalary | null;
  leave_balance: LeaveBalance | null;
}

export interface StaffDepartmentGroup {
  department: string;
  members: StaffMember[];
}

export interface StaffDirectoryResponse {
  teaching_staff: StaffDepartmentGroup[];
  non_teaching_staff: StaffDepartmentGroup[];
}

export interface StaffDeptBreakdown {
  name: string;
  total: number;
  teaching: number;
  non_teaching: number;
}

export interface StaffRoleBreakdown {
  role: string;
  count: number;
}

export interface StaffDirectorySummary {
  total_staff: number;
  teaching: number;
  non_teaching: number;
  by_department: StaffDeptBreakdown[];
  by_role: StaffRoleBreakdown[];
}

export interface LeadershipRoles {
  is_hod: boolean;
  hod_department: string | null;
  is_coordinator: boolean;
  coordinator_key_stage: string | null;
  is_class_teacher: boolean;
  class_teacher_of: string | null;
}

export interface Assignment {
  id: number;
  role: string;
  role_display: string;
  classroom: string;
  year_level: string;
  subject: string;
  subject_code: string;
  is_primary: boolean;
  is_active: boolean;
  academic_year: string;
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

export interface StaffDetail extends StaffMember {
  leadership_roles: LeadershipRoles | null;
  assignments: Assignment[];
  latest_payslip: LatestPayslip | null;
}

// ─── Parent Directory ────────────────────────────────────────
export interface ParentDirectorySummary {
  total_parents: number;
  parents_with_outstanding: number;
  total_outstanding: number;
  total_invoiced: number;
  total_paid: number;
}

export interface ParentDirectoryItem {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  children_count: number;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
}

export interface ParentDirectoryParams {
  search?: string;
  student_name?: string;
  class_id?: number;
}

export interface ParentDetail {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  children_count: number;
  children: ParentChildDetail[];
}

export interface ParentChildDetail {
  id: number;
  first_name: string;
  last_name: string;
  school_id: string;
  current_class: string;
  year_level: string;
  house: string;
  financial_summary: FinancialSummaryData;
  invoices: StudentFinanceInvoice[];
  recent_payments: StudentFinancePayment[];
  services: StudentServices;
}

export interface ParentPaymentTransaction {
  id: number;
  amount: number;
  payment_method: string;
  reference_code: string;
  transaction_date: string;
  student_name: string;
  student_id: number;
  invoice_id: number;
  invoice_title: string;
}

export interface ParentPaymentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ParentPaymentTransaction[];
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  MPESA: 'M-Pesa',
  BANK: 'Bank Transfer',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
};

export const INVOICE_STATUS_COLOR: Record<string, string> = {
  PAID: '#059669',
  PARTIAL: '#d97706',
  PENDING: '#e11d48',
  OVERPAID: '#2563eb',
  CANCELLED: '#94a3b8',
  WRITTEN_OFF: '#94a3b8',
  REFUNDED: '#94a3b8',
};

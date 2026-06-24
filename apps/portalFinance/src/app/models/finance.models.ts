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

export interface FeeCategory {
  id: number;
  name: string;
  priority: number;
  revenue_account: number | null;
  is_active: boolean;
}

export interface InvoiceItem {
  id: number;
  invoice: number;
  fee_category: number;
  fee_category_name: string;
  fee_structure: number | null;
  description: string;
  amount_due: number;
  amount_paid: number;
  amount_waived: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

export interface FamilyWallet {
  id: number;
  family: number;
  available_balance: number;
  currency: string;
  last_transaction_at: string | null;
}

export interface FamilyWalletTransaction {
  id: number;
  wallet: number;
  amount: number;
  transaction_type: 'CREDIT' | 'DEBIT' | 'PAYMENT_OVERFLOW' | 'REFUND' | 'MANUAL_ADJUSTMENT' | 'WALLET_OFFSET';
  reference: string;
  description: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface FamilyAccount {
  id: number;
  account_number: string;
  parents: number[];
  students: number[];
  wallet: FamilyWallet | null;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export interface FamilySummaryStudent {
  id: number;
  first_name: string;
  last_name: string;
  school_id: string | null;
  invoices: FamilySummaryInvoice[];
}

export interface FamilySummaryInvoice {
  id: number;
  fee_title: string | null;
  academic_year_name: string | null;
  term_name: string | null;
  amount_due: number;
  amount_paid: number;
  amount_waived: number;
  balance: number;
  status: string;
  items: FamilySummaryItem[];
}

export interface FamilySummaryItem {
  id: number;
  description: string;
  fee_category_name: string | null;
  amount_due: number;
  amount_paid: number;
  amount_waived: number;
  balance: number;
  status: string;
  _studentName?: string;
}

export interface FamilySummaryResponse {
  family_id: number;
  account_number: string;
  students: FamilySummaryStudent[];
}

export interface WaiverStats {
  total_waivers: number;
  this_month: number;
  this_term: number;
  reversed: number;
  outstanding: number;
}

export interface FeeWaiver {
  id: number;
  reference_number: string;
  invoice_item: number;
  invoice_item_details: InvoiceItem;
  student: number;
  student_name: string;
  student_school_id: string;
  family: number | null;
  family_code: string | null;
  invoice: number;
  amount: number;
  waiver_type: 'SCHOLARSHIP' | 'SIBLING' | 'STAFF_CHILD' | 'HARDSHIP' | 'BOARD_APPROVED' | 'OTHER';
  reason: string;
  entered_by: number;
  entered_by_name: string;
  authorized_by: number;
  authorized_by_name: string;
  reversed_by: number | null;
  reversed_by_name: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
  journal_entry: number | null;
  status: 'active' | 'reversed';
  created_at: string;
}

export interface FeeWaiverRequest {
  invoice_item_id: number;
  amount: number;
  waiver_type: string;
  reason: string;
  authorized_by_id: number;
}

export const WAIVER_TYPE_LABELS: Record<string, string> = {
  SCHOLARSHIP: 'Scholarship',
  SIBLING: 'Sibling Discount',
  STAFF_CHILD: 'Staff Child',
  HARDSHIP: 'Hardship',
  BOARD_APPROVED: 'Board Approved',
  OTHER: 'Other',
};

export const WAIVER_TYPE_OPTIONS = [
  { value: 'SCHOLARSHIP', label: 'Scholarship' },
  { value: 'SIBLING', label: 'Sibling Discount' },
  { value: 'STAFF_CHILD', label: 'Staff Child' },
  { value: 'HARDSHIP', label: 'Hardship' },
  { value: 'BOARD_APPROVED', label: 'Board Approved' },
  { value: 'OTHER', label: 'Other' },
];

export interface WaiverReversalRequest {
  reason: string;
}

export interface MpesaTransaction {
  id: number;
  mpesa_receipt_number: string;
  transaction_type: 'C2B' | 'STK_PUSH';
  amount: number;
  phone: string;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED';
  verified_at: string | null;
  created_at: string;
}

export interface ManualAllocationItem {
  invoice_item_id: number;
  amount: number;
}

export type AllocationStrategy = 'OLDEST_DEBT_FIRST' | 'SPECIFIC_STUDENT' | 'MANUAL' | 'WALLET_OFFSET';

export interface AllocationLine {
  id: number;
  allocation: number;
  invoice_item: number;
  invoice_id: number;
  invoice_item_details: InvoiceItem;
  student: number | null;
  student_name: string | null;
  amount: number;
  created_at: string;
}

export interface Allocation {
  id: number;
  payment_transaction: number;
  payment_reference: string;
  payment_method: string;
  transaction_date: string;
  journal_entry_id: number | null;
  family: number;
  family_code: string;
  strategy: AllocationStrategy;
  total_allocated: number;
  wallet_credit: number;
  notes: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  lines: AllocationLine[];
}

export interface AllocationStats {
  total_allocated: number;
  total_wallet_credit: number;
  manual_allocations: number;
  wallet_offset_count: number;
  average_allocation: number;
}

export const ALLOCATION_STRATEGY_LABELS: Record<AllocationStrategy, string> = {
  OLDEST_DEBT_FIRST: 'Oldest Debt First',
  SPECIFIC_STUDENT: 'Specific Student',
  MANUAL: 'Manual Mapping',
  WALLET_OFFSET: 'Wallet Offset',
};

export interface AllocationFilterParams {
  page?: number;
  page_size?: number;
  family?: number;
  strategy?: AllocationStrategy;
  search?: string;
}

export interface WalletAllocationRequest {
  reference?: string;
  notes?: string;
  manual_allocations: ManualAllocationItem[];
}

export interface FamilyPaymentRequest {
  amount: number;
  payment_method: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE';
  reference?: string;
  strategy?: AllocationStrategy;
  notes?: string;
  manual_allocations?: ManualAllocationItem[];
}

export interface FamilyPaymentResponse {
  payment_transaction_id: number;
  allocation_id: number;
  amount: number;
  wallet_credit: number;
  allocation_count: number;
  reference: string;
  strategy: AllocationStrategy;
}

export interface MpesaReceiptVerification {
  verified: boolean;
  result_code: number;
  result_desc: string;
  amount: number | null;
  duplicate: boolean;
}

export interface StudentInvoice {
  id: number;
  student: number;
  student_name: string;
  student_school_id: string;
  academic_year: number | null;
  academic_year_name?: string;
  term: number | null;
  term_name?: string;
  due_date: string | null;
  family: number | null;
  amount_due: number;
  amount_paid: number;
  amount_waived: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  items: InvoiceItem[];
}

export interface PaymentTransaction {
  id: number;
  invoice: number | null;
  family: number | null;
  family_code: string | null;
  student_name: string | null;
  amount: string;
  payment_method: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE' | 'WALLET';
  reference_code: string;
  transaction_date: string;
  journal_entry: number | null;
  allocation: Allocation | null;
}

export interface LedgerEntryItem {
  id: number;
  account_type: 'DEBIT' | 'CREDIT';
  amount: string;
  description: string;
  created_at: string;
}

export interface ChartAccount {
  id: number;
  code: string;
  name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  is_active: boolean;
}

export interface LedgerEntryLine {
  id: number;
  account: number;
  account_name: string;
  account_code: string;
  is_debit: boolean;
  amount: string;
  description: string;
  created_at: string;
}

export interface JournalEntry {
  id: number;
  reference: string;
  date: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'POSTED' | 'VOID';
  description: string;
  prepared_by_name: string;
  approved_by_name: string;
  lines: LedgerEntryLine[];
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
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
  requisition_id?: number;
  payment_method?: string;
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
  family_code?: string | null;
  allocation?: Allocation | null;
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
  family_code?: string | null;
}

export const FORMAT_CURRENCY = (amount: string | number | null | undefined, currency = 'KES'): string => {
  if (amount === null || amount === undefined) {
    return `${currency} 0.00`;
  }
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
  reversed: '#94a3b8',
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
  family_code: string | null;
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

// ─── Financial Reports ────────────────────────────────────────

export interface TrialBalanceItem {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceReport {
  accounts: TrialBalanceItem[];
  total_debits: number;
  total_credits: number;
}

export interface IncomeStatementItem {
  code: string;
  name: string;
  balance: number;
}

export interface IncomeStatementReport {
  revenues: IncomeStatementItem[];
  expenses: IncomeStatementItem[];
  total_revenue: number;
  total_expenses: number;
  net_income: number;
}

export interface CashFlowItem {
  category: string;
  amount: number;
}

export interface CashFlowReport {
  inflows: CashFlowItem[];
  outflows: CashFlowItem[];
  total_inflow: number;
  total_outflow: number;
  net_cash_flow: number;
}

// ─── Reconciliation Dashboard ────────────────────────────────────

export interface ReconciliationDashboard {
  failed_today: number;
  failed_total: number;
  failed_amount_total: string;
  pending_verification: number;
  initiated_stuck: number;
  unallocated_payments: number;
  unallocated_amount: string;
  success_callback_no_payment: number;
  c2b_total: number;
  stk_push_total: number;
  reconciliation_rate: number;
}

export interface FailedTransactionItem {
  id: number;
  checkout_request_id: string;
  merchant_request_id: string;
  transaction_type: string;
  amount: string;
  phone: string;
  account_reference: string;
  mpesa_receipt_number: string;
  result_code: number | null;
  result_desc: string;
  transaction_date: string;
  family: number | null;
  status: string;
  verified_at: string | null;
  created_at: string;
  age_hours: number;
}

export interface UnallocatedItem {
  type: 'pending_payment' | 'orphan_callback' | 'stuck_initiated';
  id: number;
  amount: string;
  created_at: string;
  family: number | null;
  family_code?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  mpesa_receipt_number?: string;
  phone?: string;
  transaction_type?: string;
  result_desc?: string;
  checkout_request_id?: string;
}

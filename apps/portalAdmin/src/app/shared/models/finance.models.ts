/**
 * Finance Fortress Module Models
 * Note: Finance is immutable - no DELETE operations
 */

export interface FeeBalance {
  student_id: string;
  student_name: string;
  year_level: string;
  total_invoiced: number;
  total_paid: number;
  current_balance: number;
  status: 'PAID' | 'ARREARS' | 'OVERPAID';
}

export interface ManualPaymentRequest {
  student_id: string;
  amount: number;
  payment_method: 'BANK' | 'CASH' | 'CHEQUE' | 'MPESA';
  reference_number: string;
  date_received: string;
  notes?: string;
}

export interface Payment {
  id: number;
  student_id: string;
  student_name: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  date_received: string;
  recorded_by: string;
  timestamp: string;
}

export interface Expense {
  id: number;
  department: string;
  description: string;
  amount: number;
  requested_by: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  request_date: string;
  approval_notes?: string;
}

export interface ExpenseApprovalRequest {
  status: 'APPROVED' | 'REJECTED';
  approval_notes: string;
}

export interface CreditNote {
  id: number;
  original_invoice_id: string;
  student_id: string;
  student_name: string;
  amount: number;
  reason: string;
  issued_by: string;
  issued_date: string;
}

export interface CreditNoteRequest {
  original_invoice_id: string;
  student_id: string;
  amount: number;
  reason: string;
}

// ─── Principal Dashboard Types ────────────────────────────────────────────────

export interface FeeStatistics {
  total_invoiced: number;
  total_collected: number;
  outstanding_arrears: number;
  collection_rate: number;
}

export interface CashFlow {
  cash_on_hand: number;
  monthly_burn_rate: number;
  total_income: number;
  total_expenses: number;
  net_income: number;
}

export interface InventoryHealth {
  total_value: number;
  low_stock_count: number;
  pending_verifications: number;
}

export interface VerificationStatus {
  pending_verifications: number;
  last_verified: string;
}

export interface ExpenseSummaryItem {
  category: string;
  total: number;
}

export interface ActivityItem {
  id: number;
  type: 'payment' | 'purchase' | 'requisition' | 'expense' | 'credit_note';
  description: string;
  amount: number;
  timestamp: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  min_threshold: number;
  last_verified: string;
}

export interface InventoryItemFull {
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
  stock_movements: StockMovementItem[];
}

export interface StockMovementItem {
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

export interface PrincipalDashboardData {
  fee_statistics: FeeStatistics;
  cash_flow: CashFlow[];
  inventory_health: InventoryHealth;
  verification_status: VerificationStatus;
  expense_summary: ExpenseSummaryItem[];
  recent_activity: ActivityItem[];
  inventory: InventoryItem[];
}

// ─── Fee Structure (for invoice generation) ──────────────────────────────────
export interface FeeStructure {
  id: number;
  academic_year: number;
  academic_year_name: string;
  term: number | null;
  year_level: number;
  year_level_name: string;
  category: string;
  fee_category: number | null;
  fee_category_name: string;
  amount: string;
  title: string;
  frequency?: string;
  description?: string;
}

// ─── Parent Directory ────────────────────────────────────────────────────────
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

export interface InvoiceCreateRequest {
  student: number;
  fee_structure: number;
  amount_due: number;
  amount_paid?: number;
}

export interface SuggestedInvoice {
  fee_structure_id: number;
  title: string;
  amount: number;
}

export interface AlreadyGeneratedInvoice {
  fee_structure_id: number;
  invoice_id: number;
  status: string;
  balance: number;
}

export interface SuggestedInvoicesResponse {
  academic_year: string;
  term: string;
  suggested: SuggestedInvoice[];
  already_generated: AlreadyGeneratedInvoice[];
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

// ─── Refactored Finance DTOs ───────────────────────────────────────────────

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

export interface FamilyWallet {
  id: number;
  family: number;
  available_balance: number;
  currency: string;
  last_transaction_at?: string | null;
}

export interface FamilyAccount {
  id: number;
  account_number: string;
  parents: number[];
  students: number[];
  wallet: FamilyWallet | null;
  is_active: boolean;
  created_at: string;
}

export interface FeeWaiver {
  id: number;
  invoice_item: number;
  invoice_item_details: InvoiceItem;
  amount: number;
  reason: string;
  entered_by: number;
  entered_by_name: string;
  authorized_by: number;
  authorized_by_name: string;
  journal_entry: number | null;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  created_at: string;
}

export interface MpesaTransaction {
  id: number;
  mpesa_receipt_number: string;
  transaction_type: 'C2B' | 'STK';
  amount: number;
  phone: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
  verified_at: string | null;
  created_at: string;
}

export type AllocationStrategy = 'OLDEST_DEBT_FIRST' | 'SPECIFIC_STUDENT' | 'MANUAL' | 'WALLET_OFFSET';

export interface AllocationLine {
  id: number;
  allocation: number;
  invoice_item: number;
  invoice_item_details: InvoiceItem;
  invoice_id?: number;
  student?: number | null;
  student_name?: string | null;
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
  family_account_number: string;
  strategy: AllocationStrategy;
  total_allocated: number;
  wallet_credit: number;
  notes?: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  lines: AllocationLine[];
}

export interface ManualAllocationItem {
  invoice_item_id: number;
  amount: number;
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

export interface FeeWaiverRequest {
  invoice_item_id: number;
  amount: number;
  reason: string;
  authorized_by_id: number;
}

export interface MpesaReceiptVerification {
  verified: boolean;
  result_code: number;
  result_desc: string;
  amount: number | null;
  duplicate: boolean;
}

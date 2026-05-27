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
  payment_method: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'MPESA';
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
  amount: string;
  title: string;
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

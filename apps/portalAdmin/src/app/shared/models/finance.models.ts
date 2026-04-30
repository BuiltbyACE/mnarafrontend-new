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

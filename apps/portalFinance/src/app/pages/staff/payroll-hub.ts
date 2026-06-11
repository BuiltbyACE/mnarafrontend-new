import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { Payslip, FORMAT_CURRENCY } from '../../models/finance.models';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, TableCell } from 'pdfmake/interfaces';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-payroll-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Payroll Hub</h1>
          <p class="page-subtitle">Manage statutory deductions, batch payroll, and payslips</p>
        </div>
      </div>

      <!-- Generate Payroll Section -->
      <div class="generate-box">
        <h3>Generate Payroll Batch</h3>
        <p>Run the statutory deduction engine to generate payslips for all staff with active salary structures.</p>
        
        <div class="generate-form">
          <div class="form-group">
            <label>Month</label>
            <select [(ngModel)]="selectedMonth" class="form-control">
              <option *ngFor="let m of [1,2,3,4,5,6,7,8,9,10,11,12]" [value]="m">{{ getMonthName(m) }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Year</label>
            <input type="number" [(ngModel)]="selectedYear" class="form-control">
          </div>
          <button class="btn-primary" (click)="generatePayroll()" [disabled]="isGenerating()">
            {{ isGenerating() ? 'Running Engine...' : 'Generate Payroll' }}
          </button>
        </div>
      </div>

      <!-- Payslips Section -->
      <div class="table-container mt-6">
        <div class="table-header-row">
          <h2>Monthly Payslips</h2>
          <button class="btn-outline" (click)="loadPayslips()">Refresh List</button>
        </div>

        @if (isLoading()) {
          <div class="loading-state">Loading payslips...</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Period</th>
                <th class="text-right">Gross Pay</th>
                <th class="text-right">Deductions</th>
                <th class="text-right">Net Pay</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (slip of payslips(); track slip.id) {
                <tr>
                  <td class="font-medium">{{ slip.staff_name || 'Staff #' + slip.staff }}</td>
                  <td>{{ getMonthName(slip.month) }} {{ slip.year }}</td>
                  <td class="text-right">{{ FORMAT_CURRENCY(slip.gross_pay) }}</td>
                  <td class="text-right text-rose">({{ FORMAT_CURRENCY(slip.paye_deduction + slip.nhif_deduction + slip.nssf_deduction) }})</td>
                  <td class="text-right font-bold text-emerald">{{ FORMAT_CURRENCY(slip.net_pay) }}</td>
                  <td>
                    <span class="status-badge" [class.paid]="slip.is_paid" [class.pending]="!slip.is_paid">
                      {{ slip.is_paid ? 'PAID' : 'PENDING' }}
                    </span>
                  </td>
                  <td class="text-right actions-cell">
                    <button *ngIf="!slip.is_paid" class="btn-action primary" (click)="markPaid(slip)">Mark Paid</button>
                    <button class="btn-action secondary" (click)="downloadPayslip(slip)">Download PDF</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-8 text-slate-500">No payslips found. Generate a batch above.</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }

    .mt-6 { margin-top: 24px; }
    
    .generate-box { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .generate-box h3 { font-size: 1.125rem; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
    .generate-box p { font-size: 0.875rem; color: #64748b; margin-bottom: 16px; }
    
    .generate-form { display: flex; align-items: flex-end; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; width: 150px; }
    .form-group label { font-size: 0.75rem; font-weight: 600; color: #334155; }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; outline: none; }
    .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }

    .btn-primary { background: #0f172a; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; border: none; height: 42px; white-space: nowrap; }
    .btn-primary:hover:not(:disabled) { background: #334155; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-outline { background: white; color: #0f172a; border: 1px solid #cbd5e1; padding: 6px 16px; border-radius: 6px; font-weight: 500; font-size: 0.875rem; cursor: pointer; }
    .btn-outline:hover { background: #f8fafc; }

    .table-container { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .table-header-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .table-header-row h2 { font-size: 1.125rem; font-weight: 600; color: #0f172a; }
    
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { background: #f8fafc; padding: 12px 20px; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 16px 20px; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    
    .font-medium { font-weight: 500; color: #0f172a; }
    .font-bold { font-weight: 700; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .py-8 { padding-top: 32px; padding-bottom: 32px; }
    
    .text-rose { color: #e11d48; }
    .text-emerald { color: #059669; }

    .status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.025em; }
    .status-badge.paid { background: #ecfdf5; color: #059669; }
    .status-badge.pending { background: #fff1f2; color: #e11d48; }

    .actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-action { padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; }
    .btn-action.primary { background: #059669; color: white; }
    .btn-action.primary:hover { background: #047857; }
    .btn-action.secondary { background: #f1f5f9; color: #475569; }
    .btn-action.secondary:hover { background: #e2e8f0; color: #0f172a; }
  `]
})
export class PayrollHubComponent implements OnInit {
  private financeService = inject(FinanceService);
  FORMAT_CURRENCY = FORMAT_CURRENCY;

  payslips = signal<Payslip[]>([]);
  isLoading = signal(false);
  isGenerating = signal(false);

  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  ngOnInit() {
    this.loadPayslips();
  }

  loadPayslips() {
    this.isLoading.set(true);
    this.financeService.getPayslips().subscribe({
      next: (res) => {
        this.payslips.set(res.results);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  generatePayroll() {
    if (!confirm(`Generate payroll for ${this.getMonthName(this.selectedMonth)} ${this.selectedYear}?`)) return;
    
    this.isGenerating.set(true);
    this.financeService.generatePayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        alert(`Success! Generated ${res.created_count} payslips.`);
        this.isGenerating.set(false);
        this.loadPayslips();
      },
      error: () => {
        alert('Failed to generate payroll. Check backend logs.');
        this.isGenerating.set(false);
      }
    });
  }

  markPaid(slip: Payslip) {
    if (!confirm('Mark as paid? This will generate immutable ledger entries.')) return;
    
    this.financeService.markPayslipPaid(slip.id).subscribe({
      next: () => {
        alert('Payslip marked as paid and ledger updated.');
        this.loadPayslips();
      },
      error: () => alert('Failed to mark as paid.')
    });
  }

  getMonthName(monthNum: number): string {
    const d = new Date();
    d.setMonth(monthNum - 1);
    return d.toLocaleString('en-US', { month: 'long' });
  }

  downloadPayslip(slip: Payslip) {
    const totalDeductions = slip.paye_deduction + slip.nhif_deduction + slip.nssf_deduction;
    
    const docDef: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          { text: 'MNARA SCHOOL', style: 'schoolName' },
          { text: 'OFFICIAL PAYSLIP', style: 'reportTitle', alignment: 'right' }
        ]
      },
      content: [
        { text: `Staff Member: ${slip.staff_name || 'Staff #' + slip.staff}`, margin: [0, 10, 0, 5], fontSize: 12, bold: true },
        { text: `Period: ${this.getMonthName(slip.month)} ${slip.year}`, margin: [0, 0, 0, 20], color: '#64748b' },
        
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [{ text: 'EARNINGS', style: 'tableHeader' }, { text: 'AMOUNT (KES)', style: 'tableHeader', alignment: 'right' }],
              [{ text: 'Gross Basic Pay', style: 'tableCell' }, { text: FORMAT_CURRENCY(slip.gross_pay).replace('KES ', ''), style: 'amountCell' }],
              [{ text: 'Total Gross Earnings', style: 'tableCellBold' }, { text: FORMAT_CURRENCY(slip.gross_pay).replace('KES ', ''), style: 'amountCellBold', fillColor: '#f8fafc' }],
              
              [{ text: 'DEDUCTIONS', style: 'sectionTitle', colSpan: 2 }, {}],
              [{ text: 'P.A.Y.E Tax', style: 'tableCell' }, { text: FORMAT_CURRENCY(slip.paye_deduction).replace('KES ', ''), style: 'amountCell' }],
              [{ text: 'N.H.I.F', style: 'tableCell' }, { text: FORMAT_CURRENCY(slip.nhif_deduction).replace('KES ', ''), style: 'amountCell' }],
              [{ text: 'N.S.S.F', style: 'tableCell' }, { text: FORMAT_CURRENCY(slip.nssf_deduction).replace('KES ', ''), style: 'amountCell' }],
              [{ text: 'Total Deductions', style: 'tableCellBold' }, { text: FORMAT_CURRENCY(totalDeductions).replace('KES ', ''), style: 'amountCellBold', fillColor: '#fff1f2', color: '#e11d48' }],
              
              [{ text: 'NET PAY', style: 'tableCellBold', margin: [0, 15, 0, 10] }, { text: FORMAT_CURRENCY(slip.net_pay).replace('KES ', ''), style: 'amountCellBold', fillColor: '#ecfdf5', color: '#059669', margin: [0, 15, 0, 10] }]
            ]
          },
          layout: 'lightHorizontalLines'
        },
        { text: 'This is a computer-generated document and does not require a signature.', style: 'footer' }
      ],
      styles: {
        schoolName: { fontSize: 16, bold: true, color: '#0f172a' },
        reportTitle: { fontSize: 16, bold: true, color: '#0f172a' },
        tableHeader: { bold: true, fontSize: 10, color: '#334155', fillColor: '#f1f5f9', margin: [0, 5, 0, 5] },
        tableCell: { fontSize: 9, color: '#0f172a', margin: [0, 4, 0, 4] },
        tableCellBold: { fontSize: 9, bold: true, color: '#0f172a', margin: [0, 4, 0, 4] },
        amountCell: { fontSize: 9, color: '#0f172a', alignment: 'right', margin: [0, 4, 0, 4] },
        amountCellBold: { fontSize: 9, bold: true, color: '#0f172a', alignment: 'right', margin: [0, 4, 0, 4] },
        sectionTitle: { fontSize: 10, bold: true, margin: [0, 15, 0, 5], color: '#64748b' },
        footer: { fontSize: 8, color: '#94a3b8', margin: [0, 40, 0, 0], alignment: 'center', italics: true }
      },
      defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDef).open();
  }
}

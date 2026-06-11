import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { FORMAT_CURRENCY } from '../../models/finance.models';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-reporting-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Financial Reports</h1>
          <p class="page-subtitle">Generate statutory financial statements via PDF</p>
        </div>
      </div>

      <div class="report-filters">
        <div class="form-group">
          <label>Report Type</label>
          <select [(ngModel)]="reportType" class="form-control">
            <option value="TRIAL_BALANCE">Trial Balance</option>
            <option value="INCOME_STATEMENT">Income Statement</option>
            <option value="CASH_FLOW">Cash Flow Statement</option>
          </select>
        </div>

        @if (reportType() !== 'TRIAL_BALANCE') {
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" [(ngModel)]="startDate" class="form-control">
          </div>
        }
        
        <div class="form-group">
          <label>End Date (As Of)</label>
          <input type="date" [(ngModel)]="endDate" class="form-control">
        </div>

        <button class="btn-primary" (click)="generateReport()" [disabled]="isGenerating()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ isGenerating() ? 'Generating...' : 'Generate PDF' }}
        </button>
      </div>

      <div class="report-preview-box">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <p>Select a report type and date range above, then click <strong>Generate PDF</strong> to download the official school statement.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }

    .report-filters { display: flex; align-items: flex-end; gap: 16px; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .form-group label { font-size: 0.75rem; font-weight: 600; color: #334155; }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; outline: none; font-family: inherit; }
    .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }

    .btn-primary { display: flex; align-items: center; justify-content: center; gap: 8px; background: #0f172a; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; border: none; transition: background 0.2s; height: 42px; white-space: nowrap; }
    .btn-primary:hover:not(:disabled) { background: #334155; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-icon { width: 18px; height: 18px; }

    .report-preview-box { background: white; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 60px 20px; display: flex; justify-content: center; align-items: center; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #64748b; text-align: center; max-width: 400px; }
    .empty-state svg { width: 48px; height: 48px; color: #94a3b8; opacity: 0.5; }
    .empty-state p { font-size: 0.875rem; line-height: 1.5; }
  `]
})
export class ReportingDashboardComponent implements OnInit {
  private financeService = inject(FinanceService);

  reportType = signal<'TRIAL_BALANCE' | 'INCOME_STATEMENT' | 'CASH_FLOW'>('TRIAL_BALANCE');
  startDate = signal<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  endDate = signal<string>(new Date().toISOString().split('T')[0]);
  isGenerating = signal(false);

  ngOnInit() {}

  generateReport() {
    this.isGenerating.set(true);
    const type = this.reportType();
    
    if (type === 'TRIAL_BALANCE') {
      this.financeService.getTrialBalance(this.endDate()).subscribe({
        next: (data) => {
          this.buildTrialBalancePdf(data);
          this.isGenerating.set(false);
        },
        error: () => this.handleError()
      });
    } else if (type === 'INCOME_STATEMENT') {
      this.financeService.getIncomeStatement(this.startDate(), this.endDate()).subscribe({
        next: (data) => {
          this.buildIncomeStatementPdf(data);
          this.isGenerating.set(false);
        },
        error: () => this.handleError()
      });
    } else if (type === 'CASH_FLOW') {
      this.financeService.getCashFlow(this.startDate(), this.endDate()).subscribe({
        next: (data) => {
          this.buildCashFlowPdf(data);
          this.isGenerating.set(false);
        },
        error: () => this.handleError()
      });
    }
  }

  private handleError() {
    this.isGenerating.set(false);
    alert('Failed to generate report. Please try again.');
  }

  // PDF Generation Logic
  private getBaseDocDef(title: string): TDocumentDefinitions {
    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          { text: 'MNARA SCHOOL', style: 'schoolName' },
          { text: title, style: 'reportTitle', alignment: 'right' }
        ]
      },
      content: [],
      styles: {
        schoolName: { fontSize: 16, bold: true, color: '#0f172a' },
        reportTitle: { fontSize: 16, bold: true, color: '#0f172a' },
        subHeader: { fontSize: 10, color: '#64748b', margin: [0, 0, 0, 20] },
        tableHeader: { bold: true, fontSize: 10, color: '#334155', fillColor: '#f1f5f9', margin: [0, 5, 0, 5] },
        tableCell: { fontSize: 9, color: '#0f172a', margin: [0, 4, 0, 4] },
        tableCellBold: { fontSize: 9, bold: true, color: '#0f172a', margin: [0, 4, 0, 4] },
        amountCell: { fontSize: 9, color: '#0f172a', alignment: 'right', margin: [0, 4, 0, 4] },
        amountCellBold: { fontSize: 9, bold: true, color: '#0f172a', alignment: 'right', margin: [0, 4, 0, 4] },
        totalRow: { fillColor: '#e2e8f0' },
        sectionTitle: { fontSize: 12, bold: true, margin: [0, 15, 0, 5], color: '#334155' }
      },
      defaultStyle: { font: 'Roboto' }
    };
  }

  private buildTrialBalancePdf(data: any) {
    const docDef = this.getBaseDocDef('TRIAL BALANCE');
    
    (docDef.content as any[]).push({
      text: `As of: ${new Date(this.endDate()).toLocaleDateString()}`,
      style: 'subHeader',
      alignment: 'right'
    });

    const body: TableCell[][] = [
      [
        { text: 'ACCOUNT CODE', style: 'tableHeader' },
        { text: 'ACCOUNT NAME', style: 'tableHeader' },
        { text: 'DEBIT (KES)', style: 'tableHeader', alignment: 'right' },
        { text: 'CREDIT (KES)', style: 'tableHeader', alignment: 'right' }
      ]
    ];

    data.accounts.forEach((acc: any) => {
      body.push([
        { text: acc.code, style: 'tableCell' },
        { text: acc.name, style: 'tableCell' },
        { text: acc.debit > 0 ? FORMAT_CURRENCY(acc.debit).replace('KES ', '') : '-', style: 'amountCell' },
        { text: acc.credit > 0 ? FORMAT_CURRENCY(acc.credit).replace('KES ', '') : '-', style: 'amountCell' }
      ]);
    });

    body.push([
      { text: '', style: 'tableCellBold' },
      { text: 'TOTAL', style: 'tableCellBold' },
      { text: FORMAT_CURRENCY(data.total_debits).replace('KES ', ''), style: 'amountCellBold', fillColor: '#e2e8f0' },
      { text: FORMAT_CURRENCY(data.total_credits).replace('KES ', ''), style: 'amountCellBold', fillColor: '#e2e8f0' }
    ]);

    (docDef.content as any[]).push({
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto'],
        body: body
      },
      layout: 'lightHorizontalLines'
    });

    pdfMake.createPdf(docDef).open();
  }

  private buildIncomeStatementPdf(data: any) {
    const docDef = this.getBaseDocDef('INCOME STATEMENT');
    
    (docDef.content as any[]).push({
      text: `Period: ${new Date(this.startDate()).toLocaleDateString()} - ${new Date(this.endDate()).toLocaleDateString()}`,
      style: 'subHeader',
      alignment: 'right'
    });

    const body: TableCell[][] = [
      [{ text: 'DESCRIPTION', style: 'tableHeader' }, { text: 'AMOUNT (KES)', style: 'tableHeader', alignment: 'right' }]
    ];

    // Revenues
    body.push([{ text: 'REVENUE', style: 'sectionTitle', colSpan: 2 }, {}]);
    data.revenues.forEach((rev: any) => {
      body.push([
        { text: rev.name, style: 'tableCell' },
        { text: FORMAT_CURRENCY(rev.balance).replace('KES ', ''), style: 'amountCell' }
      ]);
    });
    body.push([
      { text: 'Total Revenue', style: 'tableCellBold' },
      { text: FORMAT_CURRENCY(data.total_revenue).replace('KES ', ''), style: 'amountCellBold', fillColor: '#f8fafc' }
    ]);

    // Expenses
    body.push([{ text: 'EXPENSES', style: 'sectionTitle', colSpan: 2 }, {}]);
    data.expenses.forEach((exp: any) => {
      body.push([
        { text: exp.name, style: 'tableCell' },
        { text: FORMAT_CURRENCY(exp.balance).replace('KES ', ''), style: 'amountCell' }
      ]);
    });
    body.push([
      { text: 'Total Expenses', style: 'tableCellBold' },
      { text: FORMAT_CURRENCY(data.total_expenses).replace('KES ', ''), style: 'amountCellBold', fillColor: '#f8fafc' }
    ]);

    // Net Income
    body.push([
      { text: 'NET INCOME', style: 'tableCellBold', margin: [0, 15, 0, 10] },
      { text: FORMAT_CURRENCY(data.net_income).replace('KES ', ''), style: 'amountCellBold', fillColor: '#e2e8f0', margin: [0, 15, 0, 10] }
    ]);

    (docDef.content as any[]).push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto'],
        body: body
      },
      layout: 'lightHorizontalLines'
    });

    pdfMake.createPdf(docDef).open();
  }

  private buildCashFlowPdf(data: any) {
    const docDef = this.getBaseDocDef('CASH FLOW STATEMENT');
    
    (docDef.content as any[]).push({
      text: `Period: ${new Date(this.startDate()).toLocaleDateString()} - ${new Date(this.endDate()).toLocaleDateString()}`,
      style: 'subHeader',
      alignment: 'right'
    });

    const body: TableCell[][] = [
      [{ text: 'CASH FLOW ACTIVITY', style: 'tableHeader' }, { text: 'AMOUNT (KES)', style: 'tableHeader', alignment: 'right' }]
    ];

    // Inflows
    body.push([{ text: 'CASH INFLOWS (RECEIPTS)', style: 'sectionTitle', colSpan: 2 }, {}]);
    data.inflows.forEach((inf: any) => {
      body.push([
        { text: inf.category, style: 'tableCell' },
        { text: FORMAT_CURRENCY(inf.amount).replace('KES ', ''), style: 'amountCell' }
      ]);
    });
    body.push([
      { text: 'Total Inflows', style: 'tableCellBold' },
      { text: FORMAT_CURRENCY(data.total_inflow).replace('KES ', ''), style: 'amountCellBold', fillColor: '#f8fafc' }
    ]);

    // Outflows
    body.push([{ text: 'CASH OUTFLOWS (PAYMENTS)', style: 'sectionTitle', colSpan: 2 }, {}]);
    data.outflows.forEach((out: any) => {
      body.push([
        { text: out.category, style: 'tableCell' },
        { text: `(${FORMAT_CURRENCY(out.amount).replace('KES ', '')})`, style: 'amountCell', color: '#e11d48' }
      ]);
    });
    body.push([
      { text: 'Total Outflows', style: 'tableCellBold' },
      { text: `(${FORMAT_CURRENCY(data.total_outflow).replace('KES ', '')})`, style: 'amountCellBold', fillColor: '#f8fafc', color: '#e11d48' }
    ]);

    // Net Cash Flow
    body.push([
      { text: 'NET CASH FLOW', style: 'tableCellBold', margin: [0, 15, 0, 10] },
      { text: FORMAT_CURRENCY(data.net_cash_flow).replace('KES ', ''), style: 'amountCellBold', fillColor: '#e2e8f0', margin: [0, 15, 0, 10] }
    ]);

    (docDef.content as any[]).push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto'],
        body: body
      },
      layout: 'lightHorizontalLines'
    });

    pdfMake.createPdf(docDef).open();
  }
}

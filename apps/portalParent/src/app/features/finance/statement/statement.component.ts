import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { ParentApiService } from '../../../services/parent-api.service';
import { PdfStylingService } from '../../../services/pdf-styling.service';
import {
  FeeStatementChild,
  SchoolInfo,
  STATUS_COLORS,
  PAYMENT_METHOD_LABEL,
  FeeStatementResponse,
} from '../../../models/parent.models';
import { PaymentDialogComponent } from './payment-dialog.component';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-statement',
  imports: [DatePipe, MatIconModule, MatTabsModule, MatProgressSpinnerModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './statement.component.html',
  styleUrl: './statement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementComponent implements OnInit {
  private readonly api = inject(ParentApiService);
  private readonly pdfStyling = inject(PdfStylingService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly children = signal<FeeStatementChild[]>([]);
  readonly schoolInfo = signal<SchoolInfo | null>(null);
  readonly generatedAt = signal<string>('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pdfLoading = signal(false);
  readonly pdfError = signal<string | null>(null);

  readonly STATUS_COLORS = STATUS_COLORS;
  readonly PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;

  readonly totalInvoiced = computed(() =>
    this.children().reduce((sum, c) => sum + c.financial_summary.total_invoiced, 0),
  );

  readonly totalPaid = computed(() =>
    this.children().reduce((sum, c) => sum + c.financial_summary.total_paid, 0),
  );

  readonly totalOutstanding = computed(() =>
    this.children().reduce((sum, c) => sum + c.financial_summary.outstanding_balance, 0),
  );

  ngOnInit(): void {
    this.api.getFeeStatement().subscribe({
      next: (data) => {
        this.children.set(data.children);
        this.schoolInfo.set(data.school_info);
        this.generatedAt.set(data.generated_at);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load fee statement. Please try again later.');
      },
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private getPdfPayload(): FeeStatementResponse | null {
    if (this.children().length === 0) {
      this.pdfError.set('No fee statement data available.');
      return null;
    }
    return {
      children: this.children(),
      school_info: this.schoolInfo()!,
      generated_at: this.generatedAt(),
    };
  }

  viewOnlinePdf(): void {
    const data = this.getPdfPayload();
    if (!data) return;
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    try {
      const docDef = this.buildPdfDefinition(data);
      pdfMake.createPdf(docDef).open();
    } catch {
      this.pdfError.set('Failed to generate PDF. Please try again.');
    }
    this.pdfLoading.set(false);
  }

  downloadPdf(): void {
    const data = this.getPdfPayload();
    if (!data) return;
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    try {
      const docDef = this.buildPdfDefinition(data);
      pdfMake.createPdf(docDef).download('fee-statement.pdf');
    } catch {
      this.pdfError.set('Failed to generate PDF. Please try again.');
    }
    this.pdfLoading.set(false);
  }

  payForChild(child: FeeStatementChild): void {
    if (child.financial_summary.outstanding_balance <= 0) return;

    // Get IDs of pending/partial invoices
    const pendingInvoices = child.invoices.filter(inv => inv.balance > 0);
    const invoiceIds = pendingInvoices.map(inv => inv.id);

    if (invoiceIds.length === 0) {
      this.snackBar.open('No pending invoices found to pay.', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '400px',
      data: {
        studentName: child.student_name,
        totalAmount: child.financial_summary.outstanding_balance,
        invoiceIds: invoiceIds
      }
    });

    dialogRef.afterClosed().subscribe(success => {
      if (success) {
        this.snackBar.open('Payment initiated! Check your phone to complete the transaction.', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        // We could optionally reload the statement here after a delay
      }
    });
  }

  private buildPdfDefinition(data: FeeStatementResponse): TDocumentDefinitions {
    const school = data.school_info;
    const children = data.children;
    const C = this.pdfStyling.colors;
    const fm = (amount: number) => this.formatCurrency(amount);

    const content: any[] = [];

    // Header with logo and school info
    content.push(
      this.pdfStyling.buildHeader(
        {
          name: school.name,
          postal_address: school.postal_address,
          email: school.email,
          phone: school.phone,
          logo: school.logo,
        },
        { title: 'FEE STATEMENT', subtitle: new Date(data.generated_at).toLocaleDateString('en-KE') },
      ),
    );

    // Title
    content.push(this.pdfStyling.buildTitle('FEE STATEMENT'));

    // Metadata
    content.push(
      this.pdfStyling.buildMetadata(data.generated_at, [
        {
          label: 'Report Period',
          value: `${new Date(data.generated_at).getFullYear()} Academic Year`,
        },
      ]),
    );

    // Summary cards
    const grandInvoiced = children.reduce((s, c) => s + c.financial_summary.total_invoiced, 0);
    const grandPaid = children.reduce((s, c) => s + c.financial_summary.total_paid, 0);
    const grandOutstanding = children.reduce((s, c) => s + c.financial_summary.outstanding_balance, 0);

    content.push(
      this.pdfStyling.buildSummaryRow([
        { label: 'Children', value: String(children.length), icon: '👨‍👩‍👧‍👦' },
        { label: 'Total Invoiced', value: fm(grandInvoiced), color: C.primary, icon: '📋' },
        { label: 'Total Paid', value: fm(grandPaid), color: C.success, icon: '✅' },
        {
          label: 'Outstanding',
          value: fm(grandOutstanding),
          color: grandOutstanding > 0 ? C.danger : C.success,
          icon: grandOutstanding > 0 ? '⚠️' : '✓',
        },
      ]),
    );

    // Child sections
    for (const child of children) {
      const fs = child.financial_summary;

      // Child header with outstanding balance
      content.push({
        stack: [
          {
            text: `${child.student_name} — ${child.class_name || 'N/A'}`,
            fontSize: 13,
            bold: true,
            color: C.primaryDark,
            margin: [0, 0, 0, 4],
          },
          {
            columns: [
              { text: `ID: ${child.school_id || '—'} | ${child.year_level || '—'}`, fontSize: 8, color: C.slate600 },
              {
                text: `Outstanding: ${fm(fs.outstanding_balance)}`,
                fontSize: 8,
                bold: true,
                color: fs.outstanding_balance > 0 ? C.danger : C.success,
                alignment: 'right',
              },
            ],
            margin: [0, 0, 0, 12],
          },
        ],
        margin: [0, 16, 0, 0],
      });

      // Summary stats for child
      content.push(
        this.pdfStyling.buildStatsBox(
          `Financial Summary`,
          [
            {
              label: 'Invoiced',
              value: fm(fs.total_invoiced),
              color: C.slate900,
            },
            {
              label: 'Paid',
              value: fm(fs.total_paid),
              color: C.success,
            },
            {
              label: 'Balance',
              value: fm(fs.outstanding_balance),
              color: fs.outstanding_balance > 0 ? C.danger : C.success,
            },
          ],
        ),
      );

      // Invoices table if available
      if (child.invoices.length > 0) {
        content.push(this.pdfStyling.buildSectionHeader('📋 Invoices'));

        const invRows = child.invoices.map((inv) => [
          { text: inv.fee_category || '—', fontSize: 9, bold: true },
          { text: `${inv.academic_year || '—'}${inv.term ? ` / ${inv.term}` : ''}`, fontSize: 8 },
          { text: fm(inv.amount_due), alignment: 'right', fontSize: 9 },
          { text: fm(inv.amount_paid), alignment: 'right', fontSize: 9 },
          {
            text: fm(inv.balance),
            alignment: 'right',
            fontSize: 9,
            color: inv.balance > 0 ? C.danger : C.success,
            bold: true,
          },
          {
            text: inv.status,
            alignment: 'center',
            fontSize: 7,
            bold: true,
            color: C.white,
            fillColor: STATUS_COLORS[inv.status] || C.slate400,
            margin: [2, 2, 2, 2],
          },
        ]);

        content.push(
          this.pdfStyling.buildTable(
            ['FEE CATEGORY', 'YEAR / TERM', 'AMOUNT DUE', 'AMOUNT PAID', 'BALANCE', 'STATUS'],
            invRows,
            { columnWidths: ['*', 70, 72, 72, 72, 56] as any, striped: true },
          ),
        );
      }

      // Recent payments if available
      if (child.recent_payments.length > 0) {
        content.push(this.pdfStyling.buildSectionHeader('💳 Recent Payments'));

        const pmtRows = child.recent_payments.map((pmt) => [
          {
            text: pmt.transaction_date
              ? new Date(pmt.transaction_date).toLocaleDateString('en-KE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—',
            fontSize: 8,
          },
          { text: pmt.reference_code, fontSize: 8, bold: true },
          { text: fm(pmt.amount), alignment: 'right', fontSize: 9 },
          { text: PAYMENT_METHOD_LABEL[pmt.payment_method] || pmt.payment_method, fontSize: 8 },
        ]);

        content.push(
          this.pdfStyling.buildTable(
            ['DATE', 'REFERENCE', 'AMOUNT', 'METHOD'],
            pmtRows,
            { columnWidths: ['*', '*', 72, 64] as any, striped: true },
          ),
        );
      }
    }

    // Grand total section if multiple children
    if (children.length > 1) {
      content.push({
        stack: [
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: C.primary }],
            margin: [0, 12, 0, 12],
          },
          {
            columns: [
              { text: '📊 GRAND TOTAL (All Children)', bold: true, fontSize: 12, color: C.primary },
              {
                text: `${fm(grandInvoiced)} invoiced • ${fm(grandPaid)} paid • ${fm(grandOutstanding)} outstanding`,
                bold: true,
                fontSize: 11,
                color: grandOutstanding > 0 ? C.danger : C.success,
                alignment: 'right',
              },
            ],
          },
        ],
        margin: [0, 8, 0, 0],
      });
    }

    // Payment Information section
    content.push(
      this.pdfStyling.buildSectionHeader('🏦 How to Pay'),
    );
    content.push({
      stack: [
        {
          columns: [
            {
              stack: [
                { text: 'M-PESA Paybill', bold: true, fontSize: 10, color: C.slate900, margin: [0, 0, 0, 4] },
                { text: 'Business Number: 123456', fontSize: 9, color: C.slate700 },
                { text: 'Account Number: Student ID', fontSize: 9, color: C.slate700 },
              ]
            },
            {
              stack: [
                { text: 'Bank Transfer', bold: true, fontSize: 10, color: C.slate900, margin: [0, 0, 0, 4] },
                { text: 'Bank Name: Equity Bank (Kileleshwa Branch)', fontSize: 9, color: C.slate700 },
                { text: 'Account Name: Mnara School', fontSize: 9, color: C.slate700 },
                { text: 'Account Number: 01802XXXXXXXXX', fontSize: 9, color: C.slate700 },
              ]
            }
          ]
        }
      ],
      margin: [0, 8, 0, 16]
    });

    return this.pdfStyling.buildDocumentDefinition(content, {
      title: `Fee Statement - ${school.name}`,
      subject: 'Fee Statement',
      keywords: ['fee', 'statement', 'school', 'finance', 'invoice'],
      schoolName: school.name,
      fileName: 'fee-statement.pdf',
    });
  }
}

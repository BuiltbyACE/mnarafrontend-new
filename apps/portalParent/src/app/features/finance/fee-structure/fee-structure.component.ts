import { Component, inject, signal, viewChild, ElementRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { jsPDF } from 'jspdf';
import { ParentApiService } from '../../../services/parent-api.service';
import { FeeStructureChild } from '../../../models/parent.models';

@Component({
  selector: 'app-fee-structure',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTabsModule, MatButtonModule, DatePipe],
  template: `
    <div class="fs-page">
      <div class="fs-header">
        <h2>Fee Structure</h2>
        @if (children().length > 0 && !loading()) {
          <div class="fs-actions">
            <button mat-stroked-button (click)="viewOnlinePdf()" [disabled]="pdfLoading()">
              <mat-icon>visibility</mat-icon> View Online
            </button>
            <button mat-flat-button color="primary" (click)="downloadPdf()" [disabled]="pdfLoading()">
              <mat-icon>picture_as_pdf</mat-icon>
              {{ pdfLoading() ? 'Generating...' : 'Download PDF' }}
            </button>
          </div>
        }
      </div>
      @if (loading()) {
        <div class="loading-wrap"><mat-spinner diameter="32"></mat-spinner></div>
      } @else if (error()) {
        <div class="error-box">{{ error() }}</div>
      } @else if (children().length > 0) {
        <mat-tab-group>
          @for (child of children(); track child.student_id) {
            <mat-tab [label]="child.student_name">
              <div class="child-fees">
                <div class="child-summary-bar">
                  <div class="cs-item">
                    <span class="cs-label">Total Fee</span>
                    <span class="cs-value">{{ formatCurrency(child.total_fee) }}</span>
                  </div>
                </div>

                <table class="fee-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Frequency</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (cat of child.fee_categories; track cat.category) {
                      <tr>
                        <td class="cat-name">{{ cat.category }}</td>
                        <td class="mono">{{ formatCurrency(cat.amount) }}</td>
                        <td>{{ cat.frequency }}</td>
                        <td class="desc">{{ cat.description }}</td>
                      </tr>
                    }
                  </tbody>
                </table>

                <div class="meta-info">
                  <span><strong>Student:</strong> {{ child.student_name }}</span>
                  <span><strong>Class:</strong> {{ child.class_name }}</span>
                  <span><strong>Year:</strong> {{ child.year_level }}</span>
                  <span><strong>Term:</strong> {{ child.term }} — {{ child.academic_year }}</span>
                </div>
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      } @else {
        <div class="no-data">No fee structure available</div>
      }
    </div>
  `,
  styles: [`
    .fs-page { padding: 16px 0; }
    .fs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .fs-header h2 { font-size: 1.125rem; color: #1e293b; margin: 0; }
    .fs-actions { display: flex; gap: 8px; }
    .fs-actions button { display: flex; align-items: center; gap: 6px; }
    .loading-wrap, .error-box, .no-data { display: flex; justify-content: center; padding: 48px; color: #94a3b8; }
    .error-box { color: #e11d48; }
    .child-fees { padding: 16px 0; }
    .child-summary-bar { display: flex; gap: 16px; margin-bottom: 20px; }
    .cs-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; flex: 1; }
    .cs-label { display: block; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; margin-bottom: 4px; }
    .cs-value { font-size: 1.25rem; font-weight: 700; font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #1e293b; }
    .cs-value.paid { color: #059669; }
    .cs-value.negative { color: #e11d48; }
    .fee-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .fee-table th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .fee-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .cat-name { font-weight: 600; color: #1e293b; }
    .mono { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; font-weight: 500; }
    .desc { color: #64748b; max-width: 260px; }
    .meta-info { display: flex; gap: 24px; margin-top: 16px; font-size: 0.8125rem; color: #475569; background: #f8fafc; border-radius: 8px; padding: 12px 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeeStructureComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly children = signal<FeeStructureChild[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pdfLoading = signal(false);

  ngOnInit(): void {
    this.api.getFeeStructure().subscribe({
      next: (res) => {
        this.children.set(res.children);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load fee structure');
      },
    });
  }

  private buildPdf(): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pw = pdf.internal.pageSize.getWidth();

    for (let i = 0; i < this.children().length; i++) {
      if (i > 0) pdf.addPage();
      const child = this.children()[i];

      // ── Header bar ──
      pdf.setFillColor(30, 58, 138);
      pdf.rect(0, 0, pw, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('Mnara ERP', pw / 2, 16, { align: 'center' });
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Fee Structure', pw / 2, 26, { align: 'center' });

      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(1);
      pdf.line(20, 44, pw - 20, 44);

      // ── Student info ──
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(child.student_name, 20, 54);
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9);
      const infoLine = `Class: ${child.class_name}  |  Year: ${child.year_level}  |  Term: ${child.term} — ${child.academic_year}`;
      pdf.text(infoLine, 20, 62);

      // ── Summary bar (total fee only — paid/balance belong in statement) ──
      const summaryY = 72;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, summaryY, pw - 40, 28, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(20, summaryY, pw - 40, 28, 'S');

      pdf.setTextColor(148, 163, 184);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text('TOTAL FEE', pw / 2 - 12, summaryY + 8);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(this.formatCurrency(child.total_fee), pw / 2 - 12, summaryY + 20);

      // ── Category table ──
      let y = summaryY + 40;
      const colX = [20, 65, 100, 130];
      const headers = ['Category', 'Amount', 'Frequency', 'Description'];

      pdf.setFillColor(241, 245, 249);
      pdf.rect(20, y - 4, pw - 40, 6, 'F');
      pdf.setFontSize(7);
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor(100, 116, 139);
      headers.forEach((h, idx) => pdf.text(h, colX[idx] + 2, y));

      y += 8;
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);

      child.fee_categories.forEach((cat, idx) => {
        if (y > 270) { pdf.addPage(); y = 48; }
        pdf.setFont('Helvetica', 'bold');
        pdf.text(cat.category, colX[0] + 2, y);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(this.formatCurrency(cat.amount), colX[1] + 2, y);
        pdf.text(cat.frequency, colX[2] + 2, y);
        pdf.text(cat.description || '-', colX[3] + 2, y);

        pdf.setDrawColor(241, 245, 249);
        pdf.line(20, y + 1.5, pw - 20, y + 1.5);
        y += 7;
      });

      // ── Footer ──
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.3);
      const footerY = pdf.internal.pageSize.getHeight() - 15;
      pdf.line(20, footerY, pw - 20, footerY);
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(7);
      pdf.text('Generated by Mnara ERP Parent Portal', pw / 2, footerY + 5, { align: 'center' });
    }

    return pdf;
  }

  viewOnlinePdf(): void {
    this.pdfLoading.set(true);
    const pdf = this.buildPdf();
    const blobUrl = pdf.output('bloburl');
    window.open(blobUrl, '_blank');
    this.pdfLoading.set(false);
  }

  downloadPdf(): void {
    this.pdfLoading.set(true);
    const pdf = this.buildPdf();
    pdf.save('fee-structure.pdf');
    this.pdfLoading.set(false);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  }
}
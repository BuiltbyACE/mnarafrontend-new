import { Component, inject, computed, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { ParentApiService } from '../../../services/parent-api.service';
import {
  FeeStructureChild,
  FeeStructurePdfResponse,
  SchoolInfo,
} from '../../../models/parent.models';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-fee-structure',
  imports: [MatIconModule, MatProgressSpinnerModule, MatTabsModule, MatButtonModule],
  templateUrl: './fee-structure.component.html',
  styleUrl: './fee-structure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeeStructureComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly children = signal<FeeStructureChild[]>([]);
  readonly schoolInfo = signal<SchoolInfo | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pdfLoading = signal(false);
  readonly pdfError = signal<string | null>(null);
  private readonly pdfData = signal<FeeStructurePdfResponse | null>(null);

  readonly totalFee = computed(() =>
    this.children().reduce((sum, c) => sum + c.total_fee, 0),
  );

  ngOnInit(): void {
    this.api.downloadFeeStructurePdf().subscribe({
      next: (data) => {
        this.children.set(data.children);
        this.schoolInfo.set(data.school_info);
        this.pdfData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load fee structure. Please try again later.');
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

  private generatePdf(): FeeStructurePdfResponse | null {
    const cached = this.pdfData();
    if (cached) return cached;
    this.pdfError.set('Fee structure data not yet loaded. Please wait.');
    return null;
  }

  viewOnlinePdf(): void {
    const data = this.generatePdf();
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
    const data = this.generatePdf();
    if (!data) return;
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    try {
      const docDef = this.buildPdfDefinition(data);
      pdfMake.createPdf(docDef).download('fee-structure.pdf');
    } catch {
      this.pdfError.set('Failed to generate PDF. Please try again.');
    }
    this.pdfLoading.set(false);
  }

  private buildPdfDefinition(data: FeeStructurePdfResponse): TDocumentDefinitions {
    const school = data.school_info;
    const children = data.children;

    const C = {
      primary: '#2563eb',
      primaryDark: '#1d4ed8',
      primaryLight: '#3b82f6',
      blue50: '#eff6ff',
      blue100: '#dbeafe',
      blue800: '#1e40af',
      slate900: '#0f172a',
      slate600: '#475569',
      slate400: '#94a3b8',
      slate200: '#e2e8f0',
      white: '#ffffff',
    };

    const fm = (amount: number) => this.formatCurrency(amount);

    const headerContent = school.logo
      ? {
          columns: [
            { image: school.logo, width: 50, alignment: 'center', margin: [10, 10, 10, 10] },
            {
              stack: [
                { text: school.name, fontSize: 18, bold: true, color: C.white, margin: [0, 12, 0, 2] },
                { text: school.postal_address, fontSize: 8, color: '#ffffffcc', margin: [0, 0, 0, 1] },
                { text: `${school.email}  |  ${school.phone}`, fontSize: 8, color: '#ffffffcc', margin: [0, 0, 0, 12] },
              ],
              alignment: 'center',
              margin: [0, 0, 20, 0],
            },
          ],
          fillColor: C.primary,
        }
      : {
          stack: [
            { text: school.name, fontSize: 18, bold: true, color: C.white, margin: [0, 10, 0, 2] },
            { text: school.postal_address, fontSize: 8, color: '#ffffffcc', margin: [0, 0, 0, 1] },
            { text: `${school.email}  |  ${school.phone}`, fontSize: 8, color: '#ffffffcc', margin: [0, 0, 0, 10] },
          ],
          fillColor: C.primary,
          alignment: 'center',
        };

    const headerBar: any = {
      layout: 'noBorders',
      table: {
        widths: ['*'],
        body: [[headerContent]],
      },
      margin: [0, 0, 0, 16],
    };

    const title: any = {
      text: 'FEE STRUCTURE',
      fontSize: 20,
      bold: true,
      color: '#1e3a8a',
      alignment: 'center',
      margin: [0, 0, 0, 2],
    };

    const generatedAt = new Date(data.generated_at).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const generatedDate: any = {
      text: `Generated: ${generatedAt}`,
      fontSize: 8,
      color: C.slate400,
      alignment: 'center',
      margin: [0, 0, 0, 12],
    };

    const summaryCard = (label: string, value: string, valueColor = C.slate900): any => ({
      stack: [
        { text: label, fontSize: 9, color: C.slate600, margin: [0, 0, 0, 2] },
        { text: value, fontSize: 15, bold: true, color: valueColor },
      ],
      alignment: 'center',
      margin: [0, 10, 0, 10],
    });

    const summaryRow: any = {
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => C.slate200,
        vLineColor: () => C.slate200,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 2,
        paddingBottom: () => 2,
      },
      table: {
        widths: ['*', '*', '*'],
        body: [
          [
            summaryCard('Children', String(children.length)),
            summaryCard('Total Fees', fm(data.grand_total), C.primary),
            summaryCard('Period', `${children[0].term} — ${children[0].academic_year}`),
          ],
        ],
      },
      margin: [0, 0, 0, 20],
    };

    const childSections: any[] = [];

    for (const child of children) {
      const tableBody: any[][] = [
        [
          { text: 'CATEGORY', bold: true, fontSize: 8, color: C.blue800, margin: [6, 5, 6, 5] },
          { text: 'AMOUNT', bold: true, fontSize: 8, color: C.blue800, alignment: 'right', margin: [6, 5, 6, 5] },
          { text: 'FREQUENCY', bold: true, fontSize: 8, color: C.blue800, margin: [6, 5, 6, 5] },
          { text: 'DESCRIPTION', bold: true, fontSize: 8, color: C.blue800, margin: [6, 5, 6, 5] },
        ],
      ];

      for (let i = 0; i < child.fee_categories.length; i++) {
        const cat = child.fee_categories[i];
        const fill = i % 2 === 0 ? null : C.blue50;
        tableBody.push([
          { text: cat.category, bold: true, fontSize: 9, color: C.slate900, margin: [6, 4, 6, 4], fillColor: fill },
          { text: fm(cat.amount), fontSize: 9, color: C.slate900, alignment: 'right', margin: [6, 4, 6, 4], fillColor: fill },
          { text: cat.frequency, fontSize: 9, color: C.slate600, margin: [6, 4, 6, 4], fillColor: fill },
          { text: cat.description || '—', fontSize: 9, color: C.slate600, margin: [6, 4, 6, 4], fillColor: fill },
        ]);
      }

      tableBody.push([
        { text: 'TOTAL', bold: true, fontSize: 9, color: C.primary, margin: [6, 5, 6, 5], fillColor: '#f1f5f9' },
        { text: fm(child.total_fee), bold: true, fontSize: 9, color: C.primary, alignment: 'right', margin: [6, 5, 6, 5], fillColor: '#f1f5f9' },
        { text: '', fillColor: '#f1f5f9' },
        { text: '', fillColor: '#f1f5f9' },
      ]);

      childSections.push(
        {
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1 || i === tableBody.length - 1 ? 0.5 : 0.3),
            vLineWidth: () => 0,
            hLineColor: () => C.slate200,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          table: {
            widths: ['*', 80, 70, '*'],
            body: tableBody,
            headerRows: 1,
          },
          margin: [0, 0, 0, 20],
        },
      );

      childSections.push({
        text: `${child.student_name} — ${child.class_name}  |  ${child.year_level}  |  Total: ${fm(child.total_fee)}`,
        fontSize: 11,
        bold: true,
        color: C.primaryDark,
        margin: [0, 0, 0, 6],
      });
    }

    // Remove the last child header (it was added before the table for all but last is wrong)
    // Actually, let me rethink the order. Child header first, then table.
    // Let me rebuild childSections properly.

    childSections.length = 0;

    for (const child of children) {
      const tableBody: any[][] = [
        [
          { text: 'CATEGORY', bold: true, fontSize: 8, color: C.blue800, margin: [6, 5, 6, 5] },
          { text: 'AMOUNT', bold: true, fontSize: 8, color: C.blue800, alignment: 'right', margin: [6, 5, 6, 5] },
          { text: 'FREQUENCY', bold: true, fontSize: 8, color: C.blue800, margin: [6, 5, 6, 5] },
          { text: 'DESCRIPTION', bold: true, fontSize: 8, color: C.blue800, margin: [6, 5, 6, 5] },
        ],
      ];

      for (let i = 0; i < child.fee_categories.length; i++) {
        const cat = child.fee_categories[i];
        const fill = i % 2 === 0 ? null : C.blue50;
        tableBody.push([
          { text: cat.category, bold: true, fontSize: 9, color: C.slate900, margin: [6, 4, 6, 4], fillColor: fill },
          { text: fm(cat.amount), fontSize: 9, color: C.slate900, alignment: 'right', margin: [6, 4, 6, 4], fillColor: fill },
          { text: cat.frequency, fontSize: 9, color: C.slate600, margin: [6, 4, 6, 4], fillColor: fill },
          { text: cat.description || '—', fontSize: 9, color: C.slate600, margin: [6, 4, 6, 4], fillColor: fill },
        ]);
      }

      tableBody.push([
        { text: 'TOTAL', bold: true, fontSize: 9, color: C.primary, margin: [6, 5, 6, 5], fillColor: '#f1f5f9' },
        { text: fm(child.total_fee), bold: true, fontSize: 9, color: C.primary, alignment: 'right', margin: [6, 5, 6, 5], fillColor: '#f1f5f9' },
        { text: '', fillColor: '#f1f5f9' },
        { text: '', fillColor: '#f1f5f9' },
      ]);

      childSections.push(
        {
          text: `${child.student_name} — ${child.class_name}`,
          fontSize: 12,
          bold: true,
          color: C.primaryDark,
          margin: [0, 0, 0, 4],
        },
        {
          columns: [
            { text: `Year: ${child.year_level}`, fontSize: 8, color: C.slate600 },
            { text: `Total: ${fm(child.total_fee)}`, fontSize: 8, color: C.primary, alignment: 'right' },
          ],
          margin: [0, 0, 0, 8],
        },
        {
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1 || i === tableBody.length - 1 ? 0.5 : 0.3),
            vLineWidth: () => 0,
            hLineColor: () => C.slate200,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          table: {
            widths: ['*', 80, 70, '*'],
            body: tableBody,
            headerRows: 1,
          },
          margin: [0, 0, 0, 20],
        },
      );
    }

    const grandTotalSection: any = children.length > 1
      ? {
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: C.primary }], margin: [0, 8, 0, 8] },
            {
              columns: [
                { text: 'Grand Total All Children', bold: true, fontSize: 12, color: C.primary },
                { text: fm(data.grand_total), bold: true, fontSize: 14, color: C.primary, alignment: 'right' },
              ],
            },
          ],
          margin: [0, 8, 0, 0],
        }
      : null;

    return {
      info: {
        title: `Fee Structure - ${school.name}`,
        author: school.name,
        subject: 'Fee Structure',
        keywords: 'fee, structure, school, finance',
        creator: 'Mnara ERP Parent Portal',
      },
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        headerBar,
        title,
        generatedDate,
        summaryRow,
        ...childSections,
        ...(grandTotalSection ? [grandTotalSection] : []),
      ],
      footer: (currentPage: number, pageCount: number) => ({
        stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.3, lineColor: C.slate200 }] },
          {
            columns: [
              { text: `Page ${currentPage} of ${pageCount}`, fontSize: 7, color: C.slate400, alignment: 'center', margin: [0, 4, 0, 0] },
            ],
          },
          { text: 'Generated by Mnara ERP Parent Portal', fontSize: 7, color: C.slate400, alignment: 'center' },
        ],
        margin: [40, 0, 40, 20],
      }),
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: C.slate900,
      },
    };
  }
}

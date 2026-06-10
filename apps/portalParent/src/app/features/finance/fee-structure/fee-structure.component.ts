import { Component, inject, computed, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { ParentApiService } from '../../../services/parent-api.service';
import { PdfStylingService } from '../../../services/pdf-styling.service';
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
  private readonly pdfStyling = inject(PdfStylingService);

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
        { title: 'FEE STRUCTURE', subtitle: `${children[0]?.academic_year || 'Academic Year'}` },
      ),
    );

    // Title
    content.push(this.pdfStyling.buildTitle('FEE STRUCTURE', 'Price List by Student'));

    // Metadata
    content.push(
      this.pdfStyling.buildMetadata(data.generated_at, [
        {
          label: 'Academic Year',
          value: children[0]?.academic_year || 'N/A',
        },
      ]),
    );

    // Summary cards
    content.push(
      this.pdfStyling.buildSummaryRow([
        { label: 'Students', value: String(children.length), icon: '👥' },
        { label: 'Total Fees', value: fm(data.grand_total), color: C.primary, icon: '💰' },
        { label: 'Academic Year', value: `${children[0]?.term || ''}`, icon: '📅' },
      ]),
    );

    // Student fee structures
    for (const child of children) {
      // Child header
      content.push({
        stack: [
          {
            text: `${child.student_name}`,
            fontSize: 13,
            bold: true,
            color: C.primaryDark,
            margin: [0, 0, 0, 4],
          },
          {
            columns: [
              { text: `Class: ${child.class_name} • Year: ${child.year_level}`, fontSize: 8, color: C.slate600 },
              {
                text: `Total: ${fm(child.total_fee)}`,
                fontSize: 10,
                bold: true,
                color: C.primary,
                alignment: 'right',
              },
            ],
            margin: [0, 0, 0, 12],
          },
        ],
        margin: [0, 16, 0, 0],
      });

      // Fee categories table
      const feeRows = child.fee_categories.map((cat) => [
        { text: cat.category, fontSize: 9, bold: true },
        { text: fm(cat.amount), alignment: 'right', fontSize: 9 },
        { text: cat.frequency, fontSize: 8 },
        { text: cat.description || '—', fontSize: 8, color: C.slate600 },
      ]);

      // Add total row
      feeRows.push([
        { text: 'TOTAL', fontSize: 10, bold: true, color: C.primary } as any,
        { text: fm(child.total_fee), alignment: 'right', fontSize: 10, bold: true, color: C.primary } as any,
        { text: '', fontSize: 8 },
        { text: '', fontSize: 8 },
      ]);

      content.push(
        this.pdfStyling.buildTable(
          ['CATEGORY', 'AMOUNT', 'FREQUENCY', 'DESCRIPTION'],
          feeRows,
          { columnWidths: ['*', 80, 70, '*'] as any, striped: true, highlightLastRow: true },
        ),
      );
    }

    // Grand total section if multiple students
    if (children.length > 1) {
      content.push({
        stack: [
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: C.primary }],
            margin: [0, 12, 0, 12],
          },
          {
            columns: [
              { text: '📊 TOTAL FEES (All Students)', bold: true, fontSize: 12, color: C.primary },
              {
                text: fm(data.grand_total),
                bold: true,
                fontSize: 14,
                color: C.primary,
                alignment: 'right',
              },
            ],
          },
        ],
        margin: [0, 8, 0, 0],
      });
    }

    return this.pdfStyling.buildDocumentDefinition(content, {
      title: `Fee Structure - ${school.name}`,
      subject: 'Fee Structure',
      keywords: ['fee', 'structure', 'school', 'finance'],
      schoolName: school.name,
      fileName: 'fee-structure.pdf',
    });
  }
}

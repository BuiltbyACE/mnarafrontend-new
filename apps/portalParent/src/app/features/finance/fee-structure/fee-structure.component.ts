import { Component, inject, computed, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { ParentApiService } from '../../../services/parent-api.service';
import { FeeStructureChild, SchoolInfo } from '../../../models/parent.models';

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

  readonly totalFee = computed(() =>
    this.children().reduce((sum, c) => sum + c.total_fee, 0),
  );

  ngOnInit(): void {
    this.api.getFeeStructure().subscribe({
      next: (res) => {
        this.children.set(res.children);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load fee structure. Please try again later.');
      },
    });

    this.api.getSchoolInfo().subscribe({
      next: (info) => this.schoolInfo.set(info),
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  viewOnlinePdf(): void {
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    this.api.downloadFeeStructurePdf().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
        this.pdfLoading.set(false);
      },
      error: () => {
        this.pdfError.set('Failed to generate PDF. Please try again.');
        this.pdfLoading.set(false);
      },
    });
  }

  downloadPdf(): void {
    this.pdfLoading.set(true);
    this.pdfError.set(null);
    this.api.downloadFeeStructurePdf().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fee-structure.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.pdfLoading.set(false);
      },
      error: () => {
        this.pdfError.set('Failed to generate PDF. Please try again.');
        this.pdfLoading.set(false);
      },
    });
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { getApiUrl } from '@sms/core/config';
import { Payslip } from '../../shared/models/teacher.models';

interface RawPayslip {
  id: number;
  month: number;
  year: number;
  gross_pay: string | number;
  net_pay: string | number;
  is_paid: boolean;
}

interface Paginated<T> { results?: T[]; }

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Injectable({ providedIn: 'root' })
export class TeacherPayslipService {
  private readonly http = inject(HttpClient);

  private readonly allPayslips = signal<Payslip[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly selectedYear = signal(new Date().getFullYear());

  readonly filteredPayslips = computed(() =>
    this.allPayslips().filter(s => s.year === this.selectedYear())
  );

  readonly latestPayslip = computed(() =>
    this.allPayslips().length ? this.allPayslips()[0] : null
  );

  fetchPayslips(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Paginated<RawPayslip> | RawPayslip[]>(getApiUrl('/finance/payslips/'))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const rows = Array.isArray(res) ? res : (res.results ?? []);
          this.allPayslips.set(rows.map(r => this.mapPayslip(r)));
        },
        error: () => {
          this.allPayslips.set([]);
          this.error.set('Failed to load payslips');
        },
      });
  }

  private mapPayslip(r: RawPayslip): Payslip {
    const gross = Number(r.gross_pay) || 0;
    const net = Number(r.net_pay) || 0;
    return {
      id: String(r.id),
      month: MONTH_NAMES[(r.month ?? 1) - 1] ?? String(r.month),
      year: r.year,
      gross,
      net,
      deductions: Math.max(0, gross - net),
      status: r.is_paid ? 'paid' : 'pending',
    };
  }
}

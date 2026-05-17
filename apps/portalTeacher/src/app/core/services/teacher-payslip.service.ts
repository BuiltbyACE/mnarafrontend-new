import { Injectable, signal, computed } from '@angular/core';
import { Payslip } from '../../shared/models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherPayslipService {
  private readonly allPayslips = signal<Payslip[]>([
    { id: 'p1', month: 'May', year: 2026, gross: 95000, net: 79000, deductions: 16000, status: 'paid' },
    { id: 'p2', month: 'April', year: 2026, gross: 90000, net: 75600, deductions: 14400, status: 'paid' },
    { id: 'p3', month: 'March', year: 2026, gross: 88000, net: 74000, deductions: 14000, status: 'paid' },
    { id: 'p4', month: 'February', year: 2026, gross: 85000, net: 71800, deductions: 13200, status: 'paid' },
    { id: 'p5', month: 'January', year: 2026, gross: 85000, net: 72000, deductions: 13000, status: 'paid' },
    { id: 'p6', month: 'December', year: 2025, gross: 82000, net: 69600, deductions: 12400, status: 'paid' },
  ]);

  readonly selectedYear = signal(2026);

  readonly filteredPayslips = computed(() =>
    this.allPayslips().filter(s => s.year === this.selectedYear())
  );

  readonly latestPayslip = computed(() =>
    this.allPayslips().length ? this.allPayslips()[0] : null
  );
}

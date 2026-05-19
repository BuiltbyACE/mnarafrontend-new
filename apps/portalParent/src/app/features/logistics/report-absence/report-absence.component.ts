import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-report-absence',
  template: `<div class="placeholder"><h2>Report Absence</h2><p>Report child absence</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportAbsenceComponent {}
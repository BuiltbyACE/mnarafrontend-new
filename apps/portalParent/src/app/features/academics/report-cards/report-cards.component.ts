import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-report-cards',
  template: `<div class="placeholder"><h2>Report Cards</h2><p>View academic reports and grades</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCardsComponent {}
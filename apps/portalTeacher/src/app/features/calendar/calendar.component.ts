import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SchoolCalendarViewComponent } from '@sms/shared/ui';

@Component({
  selector: 'app-teacher-calendar',
  standalone: true,
  imports: [SchoolCalendarViewComponent],
  template: `
    <div class="calendar-container">
      <header class="page-header">
        <h1>Calendar</h1>
        <p class="subtitle">School events and important dates</p>
      </header>
      <app-school-calendar-view />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f0f4ff;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1e293b;
    }
    .calendar-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }
    .page-header {
      margin-bottom: 24px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 4px;
    }
    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {}

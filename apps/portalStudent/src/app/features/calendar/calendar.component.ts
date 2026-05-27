import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SchoolCalendarViewComponent } from '@sms/shared/ui';

@Component({
  selector: 'app-student-calendar',
  standalone: true,
  imports: [SchoolCalendarViewComponent],
  template: `<app-school-calendar-view />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {}

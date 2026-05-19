import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-attendance',
  template: `<div class="placeholder"><h2>Attendance</h2><p>View child's attendance records</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceComponent {}
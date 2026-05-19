import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-parent-timetable',
  template: `<div class="placeholder"><h2>Class Timetable</h2><p>View child's class schedule</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentTimetableComponent {}
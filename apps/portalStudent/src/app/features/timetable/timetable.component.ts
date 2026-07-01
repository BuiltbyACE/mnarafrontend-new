import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TimetableViewerComponent } from '@sms/frontend/scheduling-ui';

@Component({
  selector: 'app-student-timetable',
  standalone: true,
  imports: [TimetableViewerComponent],
  template: `
    <div class="timetable-page">
      <header class="page-header">
        <h1>My Timetable</h1>
        <p class="subtitle">Your weekly class schedule</p>
      </header>
      <div class="timetable-content">
        <sched-timetable-viewer mode="student" />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f0f4ff; font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; }
    .timetable-page { max-width: 1200px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; height: calc(100vh - 48px); }
    .page-header { flex: 0 0 auto; }
    .page-header h1 { font-size: 28px; font-weight: 600; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
    .timetable-content { flex: 1; overflow: hidden; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentTimetableComponent {}

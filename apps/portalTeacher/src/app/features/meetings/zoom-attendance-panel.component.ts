import { Component, ChangeDetectionStrategy, input, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ZoomMeetingService } from '../../core/services/zoom-meeting.service';
// Assuming a WebSocket service exists for real-time updates:
// import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-zoom-attendance-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="attendance-panel">
      <div class="panel-header">
        <h3><mat-icon>people</mat-icon> Live Attendance</h3>
        <span class="count">{{ records().length }} Participants</span>
      </div>
      
      <div class="panel-content">
        @if (isLoading()) {
          <div class="loading">Loading attendance data...</div>
        } @else if (records().length === 0) {
          <div class="empty">Waiting for participants to join...</div>
        } @else {
          <ul class="student-list">
            @for (rec of records(); track rec.id) {
              <li class="student-item">
                <div class="avatar">{{ rec.display_name.charAt(0).toUpperCase() }}</div>
                <div class="info">
                  <div class="name">{{ rec.display_name }}</div>
                  <div class="meta">
                    Joined at {{ rec.join_time | date:'shortTime' }}
                    @if (rec.leave_time) {
                      <span class="left">· Left {{ rec.leave_time | date:'shortTime' }}</span>
                    }
                  </div>
                </div>
                <div class="status" [class.active]="!rec.leave_time">
                  {{ !rec.leave_time ? 'Active' : 'Offline' }}
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; border-radius: 12px; background: white; border: 1px solid #e2e8f0; overflow: hidden; }
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    .panel-header h3 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .panel-header h3 mat-icon { font-size: 20px; width: 20px; height: 20px; color: #3b82f6; }
    .count { font-size: 0.85rem; font-weight: 500; color: #64748b; background: #e2e8f0; padding: 4px 10px; border-radius: 100px; }
    
    .panel-content { padding: 0; max-height: 400px; overflow-y: auto; }
    .loading, .empty { padding: 40px 20px; text-align: center; color: #64748b; font-size: 0.9rem; }
    
    .student-list { list-style: none; padding: 0; margin: 0; }
    .student-item {
      display: flex; align-items: center; gap: 16px; padding: 12px 20px;
      border-bottom: 1px solid #f1f5f9; transition: background 0.15s;
    }
    .student-item:last-child { border-bottom: none; }
    .student-item:hover { background: #f8fafc; }
    
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #e0e7ff; color: #4338ca;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 0.95rem;
    }
    .info { flex: 1; }
    .name { font-size: 0.9rem; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
    .meta { font-size: 0.75rem; color: #64748b; }
    .meta .left { color: #ef4444; }
    
    .status { font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 6px; background: #f1f5f9; color: #94a3b8; }
    .status.active { background: #dcfce7; color: #16a34a; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomAttendancePanelComponent {
  readonly classroomId = input.required<number>();
  readonly svc = inject(ZoomMeetingService);
  
  readonly records = signal<any[]>([]);
  readonly isLoading = signal(true);

  constructor() {
    effect(() => {
      const id = this.classroomId();
      if (id) {
        this.fetchAttendance(id);
        // Note: Real-time WebSocket connection to `zoom_attendance_${id}` would go here
      }
    });
  }

  fetchAttendance(id: number) {
    this.isLoading.set(true);
    this.svc.getAttendanceReport(id).subscribe({
      next: (data) => {
        this.records.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}

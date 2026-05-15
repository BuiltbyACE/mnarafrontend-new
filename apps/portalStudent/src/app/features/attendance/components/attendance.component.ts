import { Component, inject, ChangeDetectionStrategy, OnInit, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-student-attendance',
  imports: [
    DatePipe,
    MatCardModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceComponent implements OnInit {
  readonly service = inject(AttendanceService);

  readonly statusColor = computed(() => {
    const pct = this.service.attendanceData()?.stats.attendance_percentage ?? 100;
    return pct >= 90 ? 'primary' : 'warn';
  });

  readonly realtimeRate = computed(() => {
    const s = this.service.attendanceData()?.stats;
    if (!s) return 100;
    const total = s.days_present + s.days_late + s.days_absent;
    return total > 0 ? Math.round((s.days_present / total) * 100) : 100;
  });

  ngOnInit(): void {
    this.service.fetchAttendance();
  }
}

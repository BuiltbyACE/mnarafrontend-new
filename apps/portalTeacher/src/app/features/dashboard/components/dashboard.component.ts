import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { TodayClassSlot } from '../services/dashboard.service';

interface QuickActionItem {
  label: string;
  icon: string;
  route: string;
}

function buildGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const TODAY = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

const QUICK_ACTIONS: QuickActionItem[] = [
  { label: 'New Assignment', icon: 'assignment_add', route: '/teacher/assignments' },
  { label: 'Log Incident', icon: 'report', route: '/teacher/behaviour' },
  { label: 'Message Parents', icon: 'mail', route: '/teacher/messages' },
  { label: 'Take Attendance', icon: 'fact_check', route: '/teacher/attendance' },
];

function liveCount(slots: TodayClassSlot[]): number {
  return slots.filter(s => s.status === 'LIVE').length;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule, MatIconModule, MatButtonModule,
    MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  readonly dashboardService = inject(DashboardService);

  readonly greeting = buildGreeting();
  readonly todayDate = TODAY;
  readonly quickActions = QUICK_ACTIONS;

  readonly localSlots = signal<Map<number, 'ATTENDANCE_TAKEN'>>(new Map());

  constructor() {
    this.dashboardService.fetchDashboardSummary();
  }

  markAttendance(slotId: number): void {
    this.localSlots.update(m => { m.set(slotId, 'ATTENDANCE_TAKEN'); return new Map(m); });
  }

  effectiveStatus(slot: TodayClassSlot): TodayClassSlot['status'] {
    return this.localSlots().has(slot.id) ? 'ATTENDANCE_TAKEN' : slot.status;
  }

  liveCount(): number {
    const payload = this.dashboardService.data();
    return payload ? liveCount(payload.todays_classes) : 0;
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}

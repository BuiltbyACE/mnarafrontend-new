import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedCalendarService } from '@sms/shared/services';
import { CalendarGridComponent } from './calendar-grid.component';

@Component({
  selector: 'app-school-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    CalendarGridComponent,
  ],
  template: `
    <div class="calendar-view">
      <mat-card appearance="outlined" class="calendar-card">
        <mat-card-content>
          <div class="month-nav">
            <button mat-icon-button (click)="goToPreviousMonth()" class="nav-btn">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <h2 class="month-label">{{ service.monthLabel() }}</h2>
            <button mat-icon-button (click)="goToNextMonth()" class="nav-btn">
              <mat-icon>chevron_right</mat-icon>
            </button>
            <span class="nav-spacer"></span>
            <button mat-stroked-button (click)="goToToday()" class="today-btn">
              <mat-icon>today</mat-icon>
              Today
            </button>
          </div>

          @if (service.isLoading()) {
            <div class="loading-state">
              <mat-spinner diameter="32" />
            </div>
          }

          <app-calendar-grid
            [calendarDays]="service.calendarDays()"
            [weekDays]="weekDays"
          />

          <div class="legend-row">
            <span class="legend-item"><span class="legend-dot" style="background:#2563eb"></span>Term</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Holiday</span>
            <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>SDL</span>
            <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Exam</span>
            <span class="legend-item"><span class="legend-dot" style="background:#8b5cf6"></span>Meeting</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .calendar-view {
      max-width: 1100px;
      margin: 0 auto;
    }
    .calendar-card {
      border-radius: 12px;
    }
    .month-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .month-label {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: #1e293b;
      min-width: 180px;
      text-align: center;
    }
    .nav-spacer {
      flex: 1;
    }
    .today-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }
    .legend-row {
      display: flex;
      gap: 24px;
      justify-content: center;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolCalendarViewComponent implements OnInit {
  readonly service = inject(SharedCalendarService);
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    if (this.service.events().length === 0) {
      this.service.fetchCurrentMonth().subscribe();
    }
  }

  goToPreviousMonth(): void {
    this.service.goToPreviousMonth().subscribe();
  }

  goToNextMonth(): void {
    this.service.goToNextMonth().subscribe();
  }

  goToToday(): void {
    this.service.goToToday().subscribe();
  }
}

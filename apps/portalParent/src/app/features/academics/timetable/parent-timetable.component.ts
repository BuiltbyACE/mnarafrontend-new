import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParentApiService } from '../../../services/parent-api.service';
import { TimetableEntry } from '../../../models/parent.models';

@Component({
  selector: 'app-parent-timetable',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="timetable-page">
      <h2>Class Timetable</h2>
      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else if (entries().length > 0) {
        <div class="timetable-grid">
          @for (day of days; track day) {
            <div class="day-column">
              <h3 class="day-header">{{ day }}</h3>
              @for (entry of getEntriesForDay(day); track entry.subject + entry.period) {
                <div class="period-card">
                  <span class="period-time">{{ entry.start_time }} – {{ entry.end_time }}</span>
                  <span class="period-subject">{{ entry.subject }}</span>
                  <span class="period-teacher">{{ entry.teacher }}</span>
                  <span class="period-room">{{ entry.classroom }}</span>
                </div>
              }
              @if (getEntriesForDay(day).length === 0) {
                <div class="no-classes">No classes</div>
              }
            </div>
          }
        </div>
      } @else { <div class="no-data">No timetable available</div> }
    </div>
  `,
  styles: [`
    .timetable-page { padding: 16px 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .timetable-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .day-column { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
    .day-header { font-size: 0.8125rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 10px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
    .period-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
    .period-time { display: block; font-size: 0.6875rem; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #64748b; margin-bottom: 4px; }
    .period-subject { display: block; font-size: 0.8125rem; font-weight: 600; color: #1e293b; }
    .period-teacher { display: block; font-size: 0.6875rem; color: #94a3b8; }
    .period-room { display: block; font-size: 0.6875rem; color: #94a3b8; }
    .no-classes { font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 16px 0; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentTimetableComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly entries = signal<TimetableEntry[]>([]);
  readonly loading = signal(true);

  readonly days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  ngOnInit() {
    this.api.getMyTimetable().subscribe({
      next: (entries) => this.entries.set(entries),
      complete: () => this.loading.set(false),
    });
  }

  getEntriesForDay(day: string): TimetableEntry[] {
    return this.entries().filter(e => e.day.toLowerCase() === day.toLowerCase());
  }
}

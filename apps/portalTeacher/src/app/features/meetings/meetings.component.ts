import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Meeting } from '../../shared/models/teacher.models';

@Component({
  selector: 'app-teacher-meetings',
  imports: [DatePipe, NgClass, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Meetings</h1>
          <p class="page-desc">Manage your scheduled and past meetings</p>
        </div>
      </div>

      <div class="toggle-bar">
        <button class="toggle-btn" [class.active]="viewMode() === 'upcoming'" (click)="viewMode.set('upcoming')">
          <mat-icon>event</mat-icon>
          Upcoming
        </button>
        <button class="toggle-btn" [class.active]="viewMode() === 'past'" (click)="viewMode.set('past')">
          <mat-icon>history</mat-icon>
          Past
        </button>
      </div>

      @if (viewMode() === 'upcoming') {
        @if (upcomingMeetings().length > 0) {
          <div class="meeting-grid">
            @for (m of upcomingMeetings(); track m.id) {
              <mat-card class="meeting-card">
                <div class="card-top">
                  <div class="date-block">
                    <span class="date-month">{{ m.date | date:'MMM' }}</span>
                    <span class="date-day">{{ m.date | date:'d' }}</span>
                  </div>
                  <div class="card-info">
                    <h3 class="card-title">{{ m.title }}</h3>
                    <span class="card-organizer">{{ m.organizer }}</span>
                  </div>
                </div>
                <p class="card-desc">{{ m.description || '' }}</p>
                <div class="card-details">
                  <div class="detail-row">
                    <mat-icon class="detail-icon">schedule</mat-icon>
                    <span>{{ m.time }}{{ m.endTime ? ' – ' + m.endTime : '' }}</span>
                  </div>
                  @if (m.location) {
                    <div class="detail-row">
                      <mat-icon class="detail-icon">location_on</mat-icon>
                      <span>{{ m.location }}</span>
                    </div>
                  }
                  <div class="detail-row">
                    <mat-icon class="detail-icon">group</mat-icon>
                    <span>{{ m.attendeeCount ?? 0 }} attendees</span>
                  </div>
                </div>
                <div class="card-actions">
                  @if (m.joinUrl) {
                    <a class="join-btn" [href]="m.joinUrl" target="_blank" rel="noopener">
                      <mat-icon>videocam</mat-icon>
                      Join Meeting
                    </a>
                  }
                </div>
              </mat-card>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon class="empty-icon">event_busy</mat-icon>
            <p class="empty-text">No upcoming meetings scheduled</p>
          </div>
        }
      } @else {
        @if (pastMeetings().length > 0) {
          <div class="meeting-grid">
            @for (m of pastMeetings(); track m.id) {
              <mat-card class="meeting-card past">
                <div class="card-top">
                  <div class="date-block past-date">
                    <span class="date-month">{{ m.date | date:'MMM' }}</span>
                    <span class="date-day">{{ m.date | date:'d' }}</span>
                  </div>
                  <div class="card-info">
                    <h3 class="card-title">{{ m.title }}</h3>
                    <span class="card-organizer">{{ m.organizer }}</span>
                  </div>
                </div>
                <p class="card-desc">{{ m.description || '' }}</p>
                <div class="card-details">
                  <div class="detail-row">
                    <mat-icon class="detail-icon">schedule</mat-icon>
                    <span>{{ m.time }}{{ m.endTime ? ' – ' + m.endTime : '' }}</span>
                  </div>
                  @if (m.location) {
                    <div class="detail-row">
                      <mat-icon class="detail-icon">location_on</mat-icon>
                      <span>{{ m.location }}</span>
                    </div>
                  }
                  <div class="detail-row">
                    <mat-icon class="detail-icon">group</mat-icon>
                    <span>{{ m.attendeeCount ?? 0 }} attendees</span>
                  </div>
                </div>
                <span class="past-label">Completed</span>
              </mat-card>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon class="empty-icon">event_note</mat-icon>
            <p class="empty-text">No past meetings found</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
    .page { padding: 24px 32px; max-width: 1100px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-desc { font-size: 0.875rem; color: #64748b; margin: 4px 0 0; }

    .toggle-bar {
      display: flex; gap: 8px; margin-bottom: 28px;
      background: #f1f5f9; padding: 4px; border-radius: 10px;
      width: fit-content;
    }
    .toggle-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 20px; border-radius: 8px; border: none;
      background: transparent; font-size: 0.875rem; font-weight: 500;
      color: #64748b; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: all 0.15s ease;
    }
    .toggle-btn:hover { color: #334155; }
    .toggle-btn.active { background: white; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .toggle-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .meeting-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .meeting-card {
      border-radius: 10px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04); background: white;
      padding: 20px; display: flex; flex-direction: column; gap: 14px;
    }
    .meeting-card.past { opacity: 0.8; background: #fafafa; }
    .meeting-card.past .card-title { color: #64748b; }

    .card-top { display: flex; gap: 14px; }
    .date-block {
      display: flex; flex-direction: column; align-items: center;
      min-width: 52px; padding: 8px 12px;
      background: #eff6ff; border-radius: 8px;
      border: 1px solid #bfdbfe; flex-shrink: 0;
    }
    .past-date { background: #f1f5f9; border-color: #e2e8f0; }
    .date-month { font-size: 0.6875rem; font-weight: 700; color: #2563eb; text-transform: uppercase; }
    .past-date .date-month { color: #94a3b8; }
    .date-day { font-size: 1.25rem; font-weight: 700; color: #1e3a8a; line-height: 1.2; }
    .past-date .date-day { color: #64748b; }
    .card-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .card-title { font-size: 0.9375rem; font-weight: 600; color: #0f172a; margin: 0; line-height: 1.3; }
    .card-organizer { font-size: 0.75rem; color: #64748b; }

    .card-desc { font-size: 0.8125rem; color: #475569; line-height: 1.5; margin: 0; }

    .card-details { display: flex; flex-direction: column; gap: 8px; }
    .detail-row { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: #475569; }
    .detail-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }

    .card-actions { margin-top: auto; padding-top: 4px; }
    .join-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px;
      background: #2563eb; color: white; text-decoration: none;
      font-size: 0.8125rem; font-weight: 600; font-family: 'Inter', sans-serif;
      transition: background 0.15s ease;
    }
    .join-btn:hover { background: #1d4ed8; }
    .join-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .past-label {
      display: inline-flex; align-items: center; padding: 3px 10px;
      border-radius: 100px; font-size: 0.6875rem; font-weight: 600;
      background: #f1f5f9; color: #94a3b8; align-self: flex-start;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 64px 24px;
      background: white; border-radius: 10px; border: 1px dashed #e2e8f0;
    }
    .empty-icon { font-size: 44px; width: 44px; height: 44px; color: #cbd5e1; margin-bottom: 12px; }
    .empty-text { font-size: 0.9375rem; color: #94a3b8; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingsComponent {
  readonly viewMode = signal<'upcoming' | 'past'>('upcoming');

  private readonly allMeetings = signal<Meeting[]>([
    {
      id: '1', title: 'All Staff Meeting – Term 2 Kick-off',
      date: '2026-05-20', time: '14:00', endTime: '15:30',
      organizer: 'Principal’s Office', description: 'Opening meeting for Term 2. Agenda includes: term overview, new curriculum updates, staff welfare announcements, and departmental reports. All teaching and non-teaching staff are required to attend.',
      attendeeCount: 48, joinUrl: 'https://meet.google.com/abc-defg-hij', location: 'School Hall',
    },
    {
      id: '2', title: 'Science Department Meeting',
      date: '2026-05-19', time: '11:00', endTime: '12:00',
      organizer: 'Dr. Sarah Kimani', description: 'Weekly Science Department meeting to discuss lesson plans, lab schedules, and the upcoming science fair. Bring your termly schemes of work.',
      attendeeCount: 12, location: 'Science Lab B',
    },
    {
      id: '3', title: 'Parent-Teacher Conference – Form 2',
      date: '2026-05-25', time: '09:00', endTime: '15:00',
      organizer: 'Academic Affairs', description: 'Scheduled parent-teacher meetings for Form 2 parents. Each teacher will have a 15-minute slot per parent. Timetable will be shared by May 22nd.',
      attendeeCount: 24, joinUrl: 'https://teams.microsoft.com/meeting/xyz', location: 'Various Classrooms',
    },
    {
      id: '4', title: 'Sports Day Planning Committee',
      date: '2026-05-22', time: '13:00', endTime: '14:00',
      organizer: 'Mr. John Mwangi', description: 'Planning committee meeting for the annual Sports Day event scheduled for June 15th. Discuss logistics, events, and resource allocation.',
      attendeeCount: 8, location: 'Staff Room',
    },
    {
      id: '5', title: 'Term 1 Staff Meeting',
      date: '2026-04-10', time: '14:00', endTime: '15:30',
      organizer: 'Principal’s Office', description: 'End of Term 1 staff meeting covering performance review, examination results analysis, and holiday assignments.',
      attendeeCount: 52, location: 'School Hall',
    },
    {
      id: '6', title: 'Department Heads Meeting',
      date: '2026-04-05', time: '10:00', endTime: '11:30',
      organizer: 'Deputy Principal', description: 'Meeting with all Heads of Department to review term 1 academic performance and plan for term 2. Budget proposals for term 2 to be submitted.',
      attendeeCount: 9, location: 'Conference Room A',
    },
  ]);

  readonly upcomingMeetings = computed(() =>
    this.allMeetings().filter(m => new Date(m.date) >= new Date(new Date().toDateString()))
  );

  readonly pastMeetings = computed(() =>
    this.allMeetings().filter(m => new Date(m.date) < new Date(new Date().toDateString()))
  );
}

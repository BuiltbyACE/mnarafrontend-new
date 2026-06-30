import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LiveClassService, LiveClassDTO } from '../../services/live-class.service';

@Component({
  selector: 'app-live-classes',
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, DatePipe,
  ],
  template: `
    <div class="lobby">
      <div class="page-heading">
        <h2>Live Classes</h2>
        <p>Join scheduled online classes with your teachers</p>
      </div>

      @if (service.isLoading()) {
        <div class="loading-state"><mat-spinner diameter="36" /><p>Loading classes...</p></div>
      } @else if (service.payload(); as p) {
        @if (p.live_now; as liveClass) {
          <div class="section live-now-section">
            <div class="section-title">
              <span class="live-badge">
                <span class="pulsing-dot"></span>
                LIVE NOW
              </span>
            </div>
            <mat-card class="live-card" appearance="outlined">
              <mat-card-content>
                <div class="live-card-body">
                  <h3>{{ liveClass.title }}</h3>
                  <div class="live-meta">
                    <span><mat-icon>school</mat-icon> {{ liveClass.subject }}</span>
                    <span><mat-icon>person</mat-icon> {{ liveClass.teacher }}</span>
                  </div>
                </div>
                <button mat-raised-button color="warn" class="join-btn-lg" (click)="joinRoom(liveClass)">
                  <mat-icon>videocam</mat-icon> Join Class
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        }

        @if (p.upcoming.length) {
          <div class="section">
            <h3 class="section-title">Upcoming Classes</h3>
            <div class="card-grid">
              @for (cls of p.upcoming; track cls.id) {
                <mat-card class="schedule-card" appearance="outlined">
                  <mat-card-content>
                    <div class="date-badge">
                      <span class="date-month">{{ cls.start_time | date:'MMM' }}</span>
                      <span class="date-day">{{ cls.start_time | date:'d' }}</span>
                    </div>
                    <div class="card-info">
                      <h4>{{ cls.title }}</h4>
                      <div class="card-meta">
                        <span><mat-icon>school</mat-icon> {{ cls.subject }}</span>
                        <span><mat-icon>person</mat-icon> {{ cls.teacher }}</span>
                        <span><mat-icon>schedule</mat-icon> {{ cls.start_time | date:'h:mm a' }}</span>
                        @if (cls.duration_min) {
                          <span><mat-icon>timer</mat-icon> {{ cls.duration_min }} min</span>
                        }
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        }

        @if (p.past.length) {
          <div class="section">
            <h3 class="section-title">Past Classes</h3>
            <div class="card-grid">
              @for (cls of p.past; track cls.id) {
                <mat-card class="schedule-card past" appearance="outlined">
                  <mat-card-content>
                    <div class="date-badge past-badge">
                      <span class="date-month">{{ cls.start_time | date:'MMM' }}</span>
                      <span class="date-day">{{ cls.start_time | date:'d' }}</span>
                    </div>
                    <div class="card-info">
                      <h4>{{ cls.title }}</h4>
                      <div class="card-meta">
                        <span><mat-icon>school</mat-icon> {{ cls.subject }}</span>
                        <span><mat-icon>person</mat-icon> {{ cls.teacher }}</span>
                        <span><mat-icon>check_circle</mat-icon> Ended</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        }

        @if (!p.live_now && p.upcoming.length === 0 && p.past.length === 0) {
          <div class="empty-state">
            <mat-icon>videocam</mat-icon>
            <h3>No live classes</h3>
            <p>There are no scheduled live classes for this workspace yet.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .lobby { max-width: 1200px; }
    .page-heading { margin-bottom: 24px; }
    .page-heading h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #1e293b; }
    .page-heading p { margin: 4px 0 0; color: #64748b; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; min-height: 260px; justify-content: center; color: #64748b; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 1rem; font-weight: 600; color: #334155; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
    .live-badge {
      display: inline-flex; align-items: center; gap: 6px;
      color: #ef4444; font-size: 0.8rem; font-weight: 700; letter-spacing: 1px;
    }
    .pulsing-dot {
      width: 10px; height: 10px; background: #ef4444; border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .live-card {
      border: 2px solid #ef4444 !important; border-radius: 14px !important;
      background: linear-gradient(135deg, #fef2f2, #fff) !important;
    }
    .live-card mat-card-content {
      display: flex; align-items: center; gap: 20px; padding: 20px !important;
    }
    .live-card-body { flex: 1; }
    .live-card-body h3 { margin: 0 0 8px; font-size: 1.1rem; font-weight: 700; color: #991b1b; }
    .live-meta { display: flex; flex-wrap: wrap; gap: 12px; }
    .live-meta span { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #64748b; }
    .live-meta mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .join-btn-lg { flex-shrink: 0; padding: 8px 24px !important; font-size: 0.9rem !important; }
    .join-btn-lg mat-icon { margin-right: 6px; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
    .schedule-card { border-radius: 12px !important; border: 1px solid #e2e8f0 !important; transition: box-shadow 0.2s; }
    .schedule-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .schedule-card.past { opacity: 0.7; }
    .schedule-card mat-card-content { display: flex; gap: 16px; padding: 18px !important; }
    .date-badge {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 14px; background: #dbeafe; border-radius: 10px; flex-shrink: 0; align-self: flex-start;
    }
    .date-month { font-size: 0.65rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; }
    .date-day { font-size: 1.3rem; font-weight: 800; color: #1e40af; line-height: 1; }
    .past-badge { background: #e2e8f0; }
    .past-badge .date-month { color: #64748b; }
    .past-badge .date-day { color: #475569; }
    .card-info { flex: 1; }
    .card-info h4 { margin: 0 0 8px; font-size: 1rem; font-weight: 600; color: #1e293b; }
    .card-meta { display: flex; flex-wrap: wrap; gap: 8px; }
    .card-meta span { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; color: #64748b; }
    .card-meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; padding: 64px 24px;
      color: #94a3b8; text-align: center;
    }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; margin-bottom: 16px; opacity: 0.3; }
    .empty-state h3 { margin: 0 0 8px; color: #64748b; }
    .empty-state p { margin: 0; font-size: 0.9rem; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveClassesComponent implements OnInit {
  readonly service = inject(LiveClassService);
  readonly isJoining = signal(false);

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const wId = this.route.parent?.snapshot.paramMap.get('workspaceId');
    const workspaceId = wId ? parseInt(wId, 10) : undefined;
    this.service.fetchClasses(workspaceId);
  }

  joinRoom(cls: LiveClassDTO): void {
    this.isJoining.set(true);
    this.service.joinClass(cls.id).subscribe({
      next: (res) => {
        this.isJoining.set(false);
        if (res.join_url) {
          window.open(res.join_url, '_blank');
        }
      },
      error: () => this.isJoining.set(false),
    });
  }
}

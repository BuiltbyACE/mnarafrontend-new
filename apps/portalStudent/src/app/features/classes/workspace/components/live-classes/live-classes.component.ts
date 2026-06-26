import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
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
    @if (!activeRoom()) {
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
                  <div class="live-card-left">
                    <div class="live-indicator">
                      <span class="live-dot"></span>
                      <span>LIVE</span>
                    </div>
                  </div>
                  <div class="live-card-body">
                    <h3>{{ liveClass.title }}</h3>
                    <div class="live-meta">
                      <span><mat-icon>school</mat-icon> {{ liveClass.subject }}</span>
                      <span><mat-icon>person</mat-icon> {{ liveClass.teacher }}</span>
                      <span><mat-icon>people</mat-icon> {{ liveClass.participant_count }}/{{ liveClass.max_participants }}</span>
                    </div>
                    <p>{{ liveClass.description }}</p>
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
                        <span class="date-month">{{ cls.scheduled_at | date:'MMM' }}</span>
                        <span class="date-day">{{ cls.scheduled_at | date:'d' }}</span>
                      </div>
                      <div class="card-info">
                        <h4>{{ cls.title }}</h4>
                        <div class="card-meta">
                          <span><mat-icon>school</mat-icon> {{ cls.subject }}</span>
                          <span><mat-icon>person</mat-icon> {{ cls.teacher }}</span>
                          <span><mat-icon>schedule</mat-icon> {{ cls.scheduled_at | date:'h:mm a' }}</span>
                          <span><mat-icon>timer</mat-icon> {{ cls.duration_minutes }} min</span>
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
                        <span class="date-month">{{ cls.scheduled_at | date:'MMM' }}</span>
                        <span class="date-day">{{ cls.scheduled_at | date:'d' }}</span>
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
        }
      </div>
    } @else {
      <div class="theater">
        <div class="theater-header">
          <div class="theater-title">
            <h2>{{ activeRoom()?.title }}</h2>
            <div class="theater-meta">
              <span><mat-icon>school</mat-icon> {{ activeRoom()?.subject }}</span>
              <span><mat-icon>person</mat-icon> {{ activeRoom()?.teacher }}</span>
              <span class="live-timer"><mat-icon>timer</mat-icon> {{ elapsedTime() }}</span>
            </div>
          </div>
        </div>

        <div class="theater-body">
          <div class="teacher-feed">
            <div class="teacher-placeholder">
              <div class="teacher-avatar">{{ activeRoom()?.teacher_initials || 'MK' }}</div>
              <div class="teacher-name">{{ activeRoom()?.teacher }}</div>
              <div class="teacher-subject">{{ activeRoom()?.subject }}</div>
            </div>
            <div class="teacher-label">
              <span class="speaking-indicator"></span>
              Speaking
            </div>
          </div>

          <div class="participants-sidebar">
            <h3>Participants ({{ participants().length }})</h3>
            <div class="participants-list">
              @for (p of participants(); track p.id) {
                <div class="participant-item" [class.current]="p.id === 'p2'">
                  <div class="part-avatar" [style.background]="getColor(p.name)">{{ p.initials }}</div>
                  <div class="part-info">
                    <span class="part-name">
                      {{ p.name }}
                      @if (p.isTeacher) { <span class="tag teacher-tag">Teacher</span> }
                      @if (p.id === 'p2') { <span class="tag you-tag">You</span> }
                    </span>
                    <span class="part-status">
                      <span [class]="p.isMuted ? 'mic-off' : 'mic-on'"></span>
                      {{ p.isVideoOn ? 'Video On' : 'Video Off' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="theater-controls">
          <button class="ctrl-btn" [class.active]="!isMuted()" (click)="toggleMic()">
            <mat-icon>{{ isMuted() ? 'mic_off' : 'mic' }}</mat-icon>
          </button>
          <button class="ctrl-btn" [class.active]="!isVideoOff()" (click)="toggleVideo()">
            <mat-icon>{{ isVideoOff() ? 'videocam_off' : 'videocam' }}</mat-icon>
          </button>
          <button class="ctrl-btn leave-btn" (click)="leaveRoom()">
            <mat-icon>call_end</mat-icon>
          </button>
        </div>
      </div>
    }
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

    .live-indicator { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.65rem; font-weight: 700; color: #ef4444; }
    .live-dot { width: 14px; height: 14px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite; }

    .live-card-body { flex: 1; }
    .live-card-body h3 { margin: 0 0 8px; font-size: 1.1rem; font-weight: 700; color: #991b1b; }
    .live-card-body p { margin: 6px 0 0; font-size: 0.85rem; color: #94a3b8; }

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

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

    .theater {
      background: #0f172a; border-radius: 14px; overflow: hidden;
      display: flex; flex-direction: column; min-height: calc(100vh - 180px);
    }

    .theater-header {
      display: flex; align-items: center; padding: 14px 24px;
      background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .theater-title h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #fff; }
    .theater-meta { display: flex; gap: 14px; margin-top: 4px; }
    .theater-meta span { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #94a3b8; }
    .theater-meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .live-timer { font-variant-numeric: tabular-nums; letter-spacing: 1px; }

    .theater-body {
      flex: 1; display: flex; gap: 0; min-height: 0;
    }

    .teacher-feed {
      flex: 1; position: relative;
      display: flex; align-items: center; justify-content: center;
      background: #1e293b; min-height: 400px;
    }
    .teacher-placeholder { text-align: center; }
    .teacher-avatar {
      width: 100px; height: 100px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px; font-size: 2.5rem; font-weight: 700; color: #fff;
    }
    .teacher-name { font-size: 1.2rem; font-weight: 600; color: #f1f5f9; }
    .teacher-subject { font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }

    .teacher-label {
      position: absolute; bottom: 16px; left: 16px;
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; background: rgba(0,0,0,0.6); border-radius: 100px;
      font-size: 0.8rem; color: #22c55e;
    }
    .speaking-indicator {
      width: 8px; height: 8px; background: #22c55e; border-radius: 50%;
    }

    .participants-sidebar {
      width: 300px; background: #1e293b;
      border-left: 1px solid rgba(255,255,255,0.08);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .participants-sidebar h3 {
      margin: 0; padding: 16px; font-size: 0.9rem; font-weight: 600; color: #fff;
      background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .participants-list { flex: 1; overflow-y: auto; padding: 8px 0; }

    .participant-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 16px; transition: background 0.15s;
    }
    .participant-item:hover { background: rgba(255,255,255,0.04); }
    .participant-item.current { background: rgba(59,130,246,0.1); }

    .part-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .part-info { flex: 1; display: flex; flex-direction: column; }
    .part-name { font-size: 0.85rem; font-weight: 500; color: #e2e8f0; display: flex; align-items: center; gap: 4px; }
    .part-status { font-size: 0.7rem; color: #64748b; display: flex; align-items: center; gap: 4px; margin-top: 1px; }

    .tag { font-size: 0.6rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; }
    .teacher-tag { background: #3b82f6; color: #fff; }
    .you-tag { background: #22c55e; color: #fff; }

    .mic-on, .mic-off { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .mic-on { background: #22c55e; }
    .mic-off { background: #ef4444; }

    .theater-controls {
      display: flex; align-items: center; justify-content: center; gap: 16px;
      padding: 16px 24px;
      background: rgba(255,255,255,0.04); border-top: 1px solid rgba(255,255,255,0.08);
    }

    .ctrl-btn {
      width: 48px; height: 48px; border-radius: 50%; border: none;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;
      transition: all 0.2s;
    }
    .ctrl-btn:hover { background: rgba(255,255,255,0.18); }
    .ctrl-btn.active { background: #3b82f6; }
    .ctrl-btn mat-icon { font-size: 22px; width: 22px; height: 22px; }

    .leave-btn { background: #ef4444 !important; width: 56px; height: 56px; }
    .leave-btn:hover { background: #dc2626 !important; }
    .leave-btn mat-icon { font-size: 26px; width: 26px; height: 26px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveClassesComponent implements OnInit, OnDestroy {
  readonly service = inject(LiveClassService);

  readonly activeRoom = signal<LiveClassDTO | null>(null);
  readonly isMuted = signal(false);
  readonly isVideoOff = signal(false);
  readonly elapsedTime = signal('00:00');

  readonly participants = this.service.participants.asReadonly();

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const wId = this.route.parent?.snapshot.paramMap.get('workspaceId');
    const workspaceId = wId ? parseInt(wId, 10) : undefined;
    this.service.fetchClasses(workspaceId);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  joinRoom(cls: LiveClassDTO): void {
    this.service.joinClass(cls.id).subscribe({
      next: () => {
        this.activeRoom.set(cls);
        this.startTime = Date.now();
        this.startTimer();
      },
    });
  }

  leaveRoom(): void {
    const room = this.activeRoom();
    if (room) {
      this.service.leaveClass(room.id);
    }
    this.stopTimer();
    this.activeRoom.set(null);
  }

  toggleMic(): void { this.isMuted.update(v => !v); }
  toggleVideo(): void { this.isVideoOff.update(v => !v); }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      const s = Math.floor((Date.now() - this.startTime) / 1000);
      const m = String(Math.floor(s / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      this.elapsedTime.set(`${m}:${sec}`);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getColor(name: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}

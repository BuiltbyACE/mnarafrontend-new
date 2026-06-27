import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { DatePipe, NgClass, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { TeacherLiveClassService, TeacherRoom, ZoomStartConfig } from '../../core/services/teacher-live-class.service';
import { ZoomMeetingService } from '../../core/services/zoom-meeting.service';
import { ZoomAttendancePanelComponent } from './zoom-attendance-panel.component';
import { ZoomEngagementReportComponent } from './zoom-engagement-report.component';

// @ts-ignore
import { ZoomMtg } from '@zoom/meetingsdk';

@Component({
  selector: 'app-teacher-live-classes',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe, 
    NgClass, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatButtonModule,
    ZoomAttendancePanelComponent,
    ZoomEngagementReportComponent
  ],
  template: `
    @if (!activeSession()) {
      <!-- ═══════════════════════ ROOM LIST ═══════════════════════ -->
      <div class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">
              <mat-icon class="title-icon">live_tv</mat-icon>
              My Live Classes
            </h1>
            <p class="page-desc">Start a Zoom meeting for your course rooms</p>
          </div>
          <button class="refresh-btn" (click)="svc.fetchRooms()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>

        @if (svc.isLoading()) {
          <div class="loading-state"><mat-spinner diameter="32" /><span>Loading your rooms...</span></div>
        } @else if (svc.rooms().length === 0) {
          <div class="empty-state">
            <mat-icon>videocam_off</mat-icon>
            <p>No virtual rooms found. Ask your administrator to create VirtualClassroom records for your courses.</p>
          </div>
        } @else {
          <div class="room-grid">
            @for (room of svc.rooms(); track room.id) {
              <div class="room-card" [class.is-live]="room.status === 'LIVE'"
                                     [class.is-ended]="room.status === 'ENDED'">
                <div class="status-pill" [ngClass]="statusClass(room.status)">
                  @if (room.status === 'LIVE') { <span class="dot-pulse"></span> }
                  {{ statusLabel(room.status) }}
                </div>

                <div class="room-body">
                  <div class="room-subject">{{ room.subject }}</div>
                  <div class="room-title">{{ room.title }}</div>
                  <div class="room-classroom">
                    <mat-icon>class</mat-icon> {{ room.classroom }}
                  </div>
                  @if (room.scheduled_at) {
                    <div class="room-time">
                      <mat-icon>schedule</mat-icon>
                      {{ room.scheduled_at | date:'EEE d MMM, h:mm a' }} · {{ room.duration_min }} min
                    </div>
                  }
                </div>

                <div class="room-actions">
                  @if (room.status === 'LIVE') {
                    <button class="btn-join" [disabled]="startingId() === room.id"
                            (click)="rejoinClass(room)">
                      <mat-icon>videocam</mat-icon> Rejoin
                    </button>
                    <button class="btn-end" [disabled]="endingId() === room.id"
                            (click)="endClass(room)">
                      @if (endingId() === room.id) {
                        <mat-spinner diameter="16"></mat-spinner>
                      } @else {
                        <mat-icon>stop_circle</mat-icon>
                      }
                      End Class
                    </button>
                  } @else if (room.status === 'SCHEDULED') {
                    <button class="btn-start" [disabled]="startingId() === room.id"
                            (click)="startClass(room)">
                      @if (startingId() === room.id) {
                        <mat-spinner diameter="16"></mat-spinner> Starting...
                      } @else {
                        <mat-icon>play_circle</mat-icon> Start Class
                      }
                    </button>
                  } @else {
                    <span class="ended-note">
                      <mat-icon>check_circle</mat-icon> Session ended
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <!-- ═══════════════════════ ZOOM SESSION ═══════════════════════ -->
      <div class="zoom-session">
        <div class="session-header">
          <div class="session-info">
            <div class="session-subject">{{ activeSession()!.subject }}</div>
            <h2 class="session-title">{{ activeSession()!.room_title }}</h2>
            <div class="session-classroom">
              <mat-icon>class</mat-icon> {{ activeSession()!.classroom }}
              <span class="sep">·</span>
              <mat-icon>timer</mat-icon> {{ elapsedTime() }}
            </div>
          </div>
          <button class="btn-leave" (click)="endActiveSession()">
            <mat-icon>stop_circle</mat-icon> End Session
          </button>
        </div>

        <div class="session-body">
          @if (activeSession()?.status === 'LIVE') {
            <!-- Live Meeting View -->
            <div class="live-grid">
              <div class="meeting-container">
                <div id="zmmtg-root"></div>
                <div class="meeting-placeholder" [hidden]="zoomStarted()">
                  <mat-icon class="launch-icon">videocam</mat-icon>
                  <h3>Zoom Meeting Ready</h3>
                  <p class="launch-desc">Initialize the SDK to start teaching directly in the browser.</p>
                  <button class="btn-launch" (click)="launchZoom()" [disabled]="zoomLoading()">
                    @if (zoomLoading()) { <mat-spinner diameter="20" color="accent"></mat-spinner> }
                    @else { <mat-icon>play_arrow</mat-icon> }
                    Start SDK
                  </button>
                </div>
              </div>
              <div class="sidebar">
                <app-zoom-attendance-panel [classroomId]="activeRoom()!.id"></app-zoom-attendance-panel>
                
                <div class="share-card mt-4">
                  <h4>Share with Students</h4>
                  <div class="field-row">
                    <div class="field-value">
                      <input type="text" [value]="activeSession()!.join_url" readonly class="copy-input" #linkInput />
                      <button class="copy-btn" (click)="copyText(activeSession()!.join_url, linkInput)">
                        <mat-icon>content_copy</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <!-- Post-Meeting Report -->
            <div class="post-meeting">
              <h3>Session Concluded</h3>
              <app-zoom-engagement-report [classroomId]="activeRoom()!.id"></app-zoom-engagement-report>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; }

    /* ── List page ──────────────────────────────────────────── */
    .page { padding: 24px 32px; max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
    .page-title { font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; }
    .title-icon { font-size: 1.4rem; width: 1.4rem; height: 1.4rem; color: #2563eb; }
    .page-desc { font-size: 0.85rem; color: #64748b; margin: 4px 0 0; }

    .refresh-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: white; color: #475569; font-size: 0.8rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
    }
    .refresh-btn:hover { background: #f8fafc; }
    .refresh-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .loading-state { display: flex; align-items: center; gap: 12px; color: #64748b; padding: 40px; }
    .empty-state {
      text-align: center; padding: 60px 24px;
      border: 1px dashed #e2e8f0; border-radius: 12px; color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .empty-state p { font-size: 0.9rem; max-width: 400px; margin: 0 auto; }

    .room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

    .room-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 20px; display: flex; flex-direction: column; gap: 16px;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .room-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .room-card.is-live { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.12); }
    .room-card.is-ended { opacity: 0.65; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 100px; font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.5px; text-transform: uppercase; align-self: flex-start;
    }
    .status-pill.live   { background: rgba(34,197,94,0.12); color: #16a34a; }
    .status-pill.sched  { background: rgba(59,130,246,0.10); color: #2563eb; }
    .status-pill.ended  { background: #f1f5f9; color: #94a3b8; }

    .dot-pulse {
      width: 7px; height: 7px; background: #22c55e; border-radius: 50%;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

    .room-body { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .room-subject { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #2563eb; }
    .room-title   { font-size: 1.05rem; font-weight: 700; color: #0f172a; line-height: 1.3; }
    .room-classroom, .room-time {
      display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #64748b;
    }
    .room-classroom mat-icon,
    .room-time mat-icon { font-size: 14px; width: 14px; height: 14px; color: #94a3b8; }

    .room-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .btn-start, .btn-join, .btn-end {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px; border: none;
      font-size: 0.8rem; font-weight: 600; cursor: pointer;
      transition: all 0.15s; font-family: inherit;
    }
    .btn-start { background: #2563eb; color: white; flex: 1; justify-content: center; }
    .btn-start:hover:not(:disabled) { background: #1d4ed8; }
    .btn-join  { background: #22c55e; color: white; flex: 1; justify-content: center; }
    .btn-join:hover:not(:disabled)  { background: #16a34a; }
    .btn-end   { background: #ef4444; color: white; flex: 1; justify-content: center; }
    .btn-end:hover:not(:disabled)   { background: #dc2626; }
    .btn-start:disabled, .btn-end:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-start mat-icon, .btn-join mat-icon, .btn-end mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .ended-note { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #94a3b8; }
    .ended-note mat-icon { font-size: 16px; width: 16px; height: 16px; color: #22c55e; }

    /* ── Zoom Session ───────────────────────────────────────────── */
    .zoom-session {
      display: flex; flex-direction: column;
      min-height: calc(100vh - 64px);
      background: #f8fafc;
    }

    .session-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 32px;
      background: #fff; border-bottom: 1px solid #e2e8f0;
    }
    .session-subject { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; margin-bottom: 2px; }
    .session-title   { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
    .session-classroom {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.78rem; color: #64748b;
    }
    .session-classroom mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .sep { color: #94a3b8; }

    .btn-leave {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 8px; border: none;
      background: #ef4444; color: white;
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s; font-family: inherit;
    }
    .btn-leave:hover { background: #dc2626; }
    .btn-leave mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .session-body {
      flex: 1; padding: 32px; max-width: 720px; margin: 0 auto;
      display: flex; flex-direction: column; gap: 24px;
    }

    .live-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; max-width: 1400px; margin: 0 auto; }
    
    .meeting-container { 
      background: #000; border-radius: 12px; overflow: hidden; position: relative;
      min-height: 600px; display: flex; align-items: center; justify-content: center;
    }
    
    #zmmtg-root { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 10; }
    
    .meeting-placeholder { text-align: center; color: white; z-index: 1; }
    .meeting-placeholder h3 { font-size: 1.5rem; margin: 0 0 10px; }
    .meeting-placeholder p { color: #94a3b8; margin: 0 0 24px; }
    .mt-4 { margin-top: 16px; }

    .post-meeting { max-width: 800px; margin: 0 auto; }
    .post-meeting h3 { font-size: 1.5rem; color: #0f172a; margin-bottom: 24px; }
    
    .launch-icon { font-size: 64px; width: 64px; height: 64px; color: #2d8cff; margin-bottom: 16px; }

    .btn-launch {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 32px; border-radius: 12px; border: none;
      background: #2d8cff; color: white;
      font-size: 1rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s; font-family: inherit;
    }
    .btn-launch:hover:not(:disabled) { background: #1a7aff; }
    .btn-launch:disabled { opacity: 0.7; cursor: wait; }
    .btn-launch mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .share-card { text-align: left; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .share-card h4 { margin: 0 0 12px; font-size: 1rem; font-weight: 700; color: #0f172a; }


    .field-row { margin-bottom: 16px; }
    .field-row.half { flex: 1; }
    .inline-fields { display: flex; gap: 16px; }

    .field-label {
      display: block; font-size: 0.6875rem; text-transform: uppercase;
      letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px;
    }
    .field-value {
      display: flex; align-items: center; gap: 6px;
    }
    .copy-input {
      flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0;
      border-radius: 6px; font-size: 0.8125rem; color: #334155;
      background: #f8fafc; font-family: 'SF Mono','Consolas',monospace;
      outline: none;
    }
    .copy-btn {
      display: flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border: 1px solid #e2e8f0;
      border-radius: 6px; background: #fff; cursor: pointer;
      transition: all 0.15s; color: #64748b;
    }
    .copy-btn:hover { background: #f1f5f9; color: #2563eb; }
    .copy-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherLiveClassesComponent implements OnInit {
  readonly svc = inject(TeacherLiveClassService);
  readonly zoomSvc = inject(ZoomMeetingService);

  readonly activeSession = signal<ZoomStartConfig | null>(null);
  readonly activeRoom = signal<TeacherRoom | null>(null);
  readonly startingId = signal<number | null>(null);
  readonly endingId = signal<number | null>(null);
  readonly elapsedTime = signal('00:00');
  
  readonly zoomLoading = signal(false);
  readonly zoomStarted = signal(false);

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private startTimestamp = 0;

  ngOnInit(): void {
    this.svc.fetchRooms();
    ZoomMtg.setZoomJSLib('https://source.zoom.us/3.1.6/lib', '/av');
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();
  }

  startClass(room: TeacherRoom): void {
    this.startingId.set(room.id);
    this.svc.startClass(room.id).subscribe({
      next: (config) => {
        this.startingId.set(null);
        this.svc.rooms.update(rooms =>
          rooms.map(r => r.id === room.id ? { ...r, status: 'LIVE' } : r)
        );
        this.activeSession.set(config);
        this.activeRoom.set(room);
        this.startTimestamp = Date.now();
        this.startTimer();
      },
      error: () => this.startingId.set(null),
    });
  }

  rejoinClass(room: TeacherRoom): void {
    this.startClass(room);
  }

  endClass(room: TeacherRoom): void {
    this.endingId.set(room.id);
    this.svc.endClass(room.id).subscribe({
      next: () => {
        this.endingId.set(null);
        this.svc.rooms.update(rooms =>
          rooms.map(r => r.id === room.id ? { ...r, status: 'ENDED' } : r)
        );
        if (this.activeRoom()?.id === room.id) {
          this.endActiveSession();
        }
      },
      error: () => this.endingId.set(null),
    });
  }

  endActiveSession(): void {
    this.stopTimer();
    this.zoomStarted.set(false);
    
    // Attempt to leave SDK meeting cleanly if active
    try {
       ZoomMtg.leaveMeeting({});
    } catch(e) {}
    
    this.activeSession.set(null);
    this.activeRoom.set(null);
  }

  launchZoom(): void {
    const session = this.activeSession();
    if (!session) return;
    
    this.zoomLoading.set(true);
    
    this.zoomSvc.getSdkSignature(session.meeting_id, 1).subscribe({
      next: (config) => {
        const root = document.getElementById('zmmtg-root');
        if (root) {
          ZoomMtg.init({
            leaveUrl: window.location.href,
            patchJsMedia: true,
            success: (success: any) => {
              ZoomMtg.join({
                signature: config.signature,
                sdkKey: config.sdkKey,
                meetingNumber: config.meetingNumber,
                passWord: config.passWord || '',
                userName: config.userName,
                userEmail: config.userEmail,
                success: (success: any) => {
                  this.zoomStarted.set(true);
                  this.zoomLoading.set(false);
                },
                error: (error: any) => {
                  console.error("Zoom join error", error);
                  this.zoomLoading.set(false);
                }
              });
            },
            error: (error: any) => {
              console.error("Zoom init error", error);
              this.zoomLoading.set(false);
            }
          });
        }
      },
      error: () => this.zoomLoading.set(false)
    });
  }

  copyText(text: string, input: HTMLInputElement): void {
    navigator.clipboard.writeText(text).then(() => {
      input.select();
    });
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      const s = Math.floor((Date.now() - this.startTimestamp) / 1000);
      const m = String(Math.floor(s / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      this.elapsedTime.set(`${m}:${sec}`);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  statusClass(s: string): string {
    return s === 'LIVE' ? 'live' : s === 'SCHEDULED' ? 'sched' : 'ended';
  }
  statusLabel(s: string): string {
    return s === 'LIVE' ? 'Live Now' : s === 'SCHEDULED' ? 'Scheduled' : 'Ended';
  }
}
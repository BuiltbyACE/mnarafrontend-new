import { Component, inject, OnInit, signal, computed, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OmnichannelService } from '@sms/shared/communication';
import { AudienceType, OmnichannelPayload } from '@sms/shared/communication';

@Component({
  selector: 'ss-omnichannel-composer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="composer-overlay">
      <div class="composer-dialog">
        <div class="dialog-header">
          <div class="header-left">
            <mat-icon class="header-icon">campaign</mat-icon>
            <div>
              <h2 class="header-title">New Message</h2>
              <p class="header-subtitle">Send broadcasts and announcements</p>
            </div>
          </div>
          <button mat-icon-button class="close-btn" (click)="onCancel()" [disabled]="service.isSending()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="dialog-body">
          <div class="form-section">
            <label class="field-label">Audience</label>
            <div class="select-wrapper">
              <select
                class="premium-select"
                [ngModel]="selectedAudience()"
                (ngModelChange)="onAudienceChange($event)"
                [disabled]="service.isSending()"
              >
                <option value="" disabled>Select audience...</option>
                <option [value]="AudienceType.ALL">Everyone</option>
                <option [value]="AudienceType.STAFF">Staff Only</option>
                <option [value]="AudienceType.STUDENTS">Students Only</option>
                <option [value]="AudienceType.PARENTS">Parents Only</option>
                <option [value]="AudienceType.YEAR_LEVEL_PARENTS">Parents by Year Level</option>
              </select>
              <mat-icon class="select-arrow">expand_more</mat-icon>
            </div>
          </div>

          @if (showYearLevel()) {
            <div class="form-section year-level-section">
              <label class="field-label">Year Level</label>
              <div class="select-wrapper">
                <select
                  class="premium-select"
                  [(ngModel)]="selectedYearLevelId"
                  [disabled]="service.isSending()"
                >
                  <option [value]="null" disabled>Select year level...</option>
                  @for (yl of service.yearLevels(); track yl.id) {
                    <option [value]="yl.id">{{ yl.name }}</option>
                  }
                </select>
                <mat-icon class="select-arrow">expand_more</mat-icon>
              </div>
              @if (service.yearLevels().length === 0) {
                <div class="loading-hint">
                  <mat-spinner diameter="14" />
                  <span>Loading year levels...</span>
                </div>
              }
            </div>
          }

          <div class="form-section">
            <label class="field-label">Message</label>
            <textarea
              class="message-textarea"
              placeholder="Type your message here..."
              [(ngModel)]="messageBody"
              rows="5"
              maxlength="5000"
              [disabled]="service.isSending()"
            ></textarea>
            <div class="char-counter" [class.warning]="charCount() > 160" [class.danger]="charCount() > 320">
              <span>{{ charCount() }} / 5,000</span>
              @if (charCount() > 160) {
                <span class="sms-cost-warning">
                  <mat-icon>info</mat-icon>
                  Exceeds 160 chars — {{ smsSegments() }} SMS segments ({{ smsSegments() }}x cost)
                </span>
              }
            </div>
          </div>

          <div class="form-section channels-section">
            <label class="field-label">Channels</label>
            <div class="channel-toggles">
              <button
                class="channel-toggle"
                [class.active]="sendInApp()"
                (click)="sendInApp.set(!sendInApp())"
                [disabled]="service.isSending()"
                type="button"
              >
                <mat-icon class="toggle-icon">notifications</mat-icon>
                <div class="toggle-content">
                  <span class="toggle-label">In-App Announcement</span>
                  <span class="toggle-desc">Visible in school noticeboards</span>
                </div>
                <div class="toggle-switch" [class.on]="sendInApp()">
                  <div class="toggle-knob"></div>
                </div>
              </button>

              <button
                class="channel-toggle"
                [class.active]="sendSms()"
                (click)="sendSms.set(!sendSms())"
                [disabled]="service.isSending()"
                type="button"
              >
                <mat-icon class="toggle-icon">sms</mat-icon>
                <div class="toggle-content">
                  <span class="toggle-label">SMS</span>
                  <span class="toggle-desc">Sent via Africa's Talking</span>
                </div>
                <div class="toggle-switch" [class.on]="sendSms()">
                  <div class="toggle-knob"></div>
                </div>
              </button>
            </div>
          </div>

          @if (service.error(); as err) {
            <div class="error-banner">
              <mat-icon>error</mat-icon>
              <span>{{ err }}</span>
            </div>
          }
        </div>

        <div class="dialog-footer">
          <div class="footer-summary">
            @if (selectedAudience()) {
              <span class="summary-badge">
                {{ audienceLabel() }}
                @if (selectedYearLevelId() && showYearLevel()) {
                  <span> — {{ selectedYearLevelName() }}</span>
                }
              </span>
            }
            <span class="summary-channels">
              @if (sendSms() && sendInApp()) { SMS + In-App }
              @else if (sendSms()) { SMS only }
              @else if (sendInApp()) { In-App only }
              @else { No channel selected }
            </span>
          </div>
          <div class="footer-actions">
            <button mat-stroked-button (click)="onCancel()" [disabled]="service.isSending()">Cancel</button>
            <button
              mat-flat-button
              color="primary"
              [disabled]="!canSubmit()"
              (click)="onSubmit()"
              class="send-btn"
            >
              @if (service.isSending()) {
                <mat-spinner diameter="18" />
                Sending...
              } @else {
                <mat-icon>send</mat-icon>
                Send Message
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .composer-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; backdrop-filter: blur(2px);
    }
    .composer-dialog {
      width: 560px; max-width: 94vw; max-height: 90vh; overflow: hidden;
      background: #fff; border-radius: 16px; display: flex; flex-direction: column;
      box-shadow: 0 25px 80px rgba(0,0,0,0.35);
      animation: slideUp 0.2s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dialog-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 24px 28px 0; gap: 16px;
    }
    .header-left { display: flex; align-items: flex-start; gap: 14px; }
    .header-icon { font-size: 28px; width: 28px; height: 28px; color: #2563eb; margin-top: 2px; }
    .header-title { margin: 0; font-size: 20px; font-weight: 700; color: #0f172a; }
    .header-subtitle { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .close-btn { color: #94a3b8; flex-shrink: 0; }

    .dialog-body { padding: 20px 28px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 18px; }
    .form-section { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }

    .select-wrapper { position: relative; }
    .premium-select {
      width: 100%; padding: 11px 16px; padding-right: 40px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 14px; font-family: inherit; color: #0f172a;
      background: #fff; appearance: none; cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .premium-select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    .premium-select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
    .select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

    .year-level-section {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .loading-hint { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; margin-top: 4px; }

    .message-textarea {
      width: 100%; padding: 12px 16px; resize: vertical; min-height: 100px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 14px; font-family: inherit; color: #0f172a; line-height: 1.6;
      transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box;
    }
    .message-textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    .message-textarea:disabled { background: #f8fafc; color: #94a3b8; }

    .char-counter {
      display: flex; flex-direction: column; gap: 2px;
      font-size: 11px; color: #94a3b8; text-align: right; margin-top: 4px;
    }
    .char-counter.warning { color: #d97706; }
    .char-counter.danger { color: #dc2626; }
    .sms-cost-warning { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #d97706; }
    .sms-cost-warning mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .channel-toggles { display: flex; flex-direction: column; gap: 8px; }
    .channel-toggle {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 18px; border: 1.5px solid #e2e8f0; border-radius: 12px;
      background: #fff; cursor: pointer; transition: all 0.15s;
      text-align: left; font-family: inherit; width: 100%;
    }
    .channel-toggle:hover { border-color: #93c5fd; background: #f8faff; }
    .channel-toggle.active { border-color: #2563eb; background: #eff6ff; }
    .channel-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
    .toggle-icon { font-size: 22px; width: 22px; height: 22px; color: #64748b; flex-shrink: 0; }
    .channel-toggle.active .toggle-icon { color: #2563eb; }
    .toggle-content { flex: 1; }
    .toggle-label { display: block; font-size: 14px; font-weight: 600; color: #0f172a; }
    .toggle-desc { display: block; font-size: 11px; color: #94a3b8; margin-top: 1px; }
    .toggle-switch {
      width: 44px; height: 24px; border-radius: 12px; background: #e2e8f0;
      position: relative; transition: background 0.2s; flex-shrink: 0;
    }
    .toggle-switch.on { background: #2563eb; }
    .toggle-knob {
      width: 18px; height: 18px; border-radius: 50%; background: #fff;
      position: absolute; top: 3px; left: 3px; transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .toggle-switch.on .toggle-knob { transform: translateX(20px); }

    .error-banner { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fef2f2; border-radius: 10px; color: #dc2626; font-size: 13px; }

    .dialog-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 28px 20px; border-top: 1px solid #f1f5f9; gap: 12px;
    }
    .footer-summary { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .summary-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; color: #2563eb;
    }
    .summary-channels { font-size: 11px; color: #94a3b8; }
    .footer-actions { display: flex; gap: 8px; align-items: center; }
    .send-btn { display: flex; align-items: center; gap: 6px; min-width: 140px; justify-content: center; }
    .send-btn mat-spinner { display: inline-block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OmnichannelComposerComponent implements OnInit {
  readonly service = inject(OmnichannelService);
  private readonly snackBar = inject(MatSnackBar);

  readonly closed = output<void>();

  readonly AudienceType = AudienceType;

  readonly selectedAudience = signal<string>('');
  readonly selectedYearLevelId = signal<number | null>(null);
  readonly messageBody = signal('');
  readonly sendSms = signal(true);
  readonly sendInApp = signal(true);

  readonly showYearLevel = computed(() =>
    this.selectedAudience() === AudienceType.YEAR_LEVEL_PARENTS
  );

  readonly charCount = computed(() => this.messageBody().length);

  readonly smsSegments = computed(() => {
    const len = this.messageBody().length;
    if (len === 0) return 0;
    return Math.ceil(len / 160);
  });

  readonly audienceLabel = computed(() => {
    const map: Record<string, string> = {
      [AudienceType.ALL]: 'Everyone',
      [AudienceType.STAFF]: 'Staff',
      [AudienceType.STUDENTS]: 'Students',
      [AudienceType.PARENTS]: 'Parents',
      [AudienceType.YEAR_LEVEL_PARENTS]: 'Parents by Year Level',
    };
    return map[this.selectedAudience()] || '';
  });

  readonly selectedYearLevelName = computed(() => {
    const id = this.selectedYearLevelId();
    if (!id) return '';
    return this.service.yearLevels().find(y => y.id === id)?.name || '';
  });

  readonly canSubmit = computed(() => {
    if (!this.selectedAudience()) return false;
    if (this.showYearLevel() && !this.selectedYearLevelId()) return false;
    if (!this.messageBody().trim()) return false;
    if (!this.sendSms() && !this.sendInApp()) return false;
    return true;
  });

  ngOnInit(): void {
    this.service.loadYearLevels();
    this.sendSms.set(true);
    this.sendInApp.set(true);
  }

  onAudienceChange(value: string): void {
    this.selectedAudience.set(value);
    if (value !== AudienceType.YEAR_LEVEL_PARENTS) {
      this.selectedYearLevelId.set(null);
    }
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    const payload: OmnichannelPayload = {
      title: this.audienceLabel() + ' — ' + (this.messageBody().slice(0, 60) + (this.messageBody().length > 60 ? '...' : '')),
      body: this.messageBody().trim(),
      audience_type: this.selectedAudience() as AudienceType,
      year_level_id: this.selectedYearLevelId() ?? undefined,
      send_sms: this.sendSms(),
      send_in_app: this.sendInApp(),
    };

    this.service.sendOmnichannel(payload).subscribe({
      next: (result) => {
        const parts: string[] = [];
        if (result.announcement) parts.push('In-App');
        if (result.broadcast) parts.push('SMS');
        this.snackBar.open(`Message sent via ${parts.join(' + ')}`, 'Close', { duration: 5000 });

        if (result.broadcast && this.sendSms()) {
          this.service.dispatchBroadcast(result.broadcast.id).subscribe({
            error: () => this.snackBar.open('Broadcast created but dispatch failed', 'Close', { duration: 4000 }),
          });
        }
        this.onCancel();
      },
      error: () => {
        this.snackBar.open('Failed to send message', 'Close', { duration: 5000 });
      },
    });
  }

  onCancel(): void {
    this.service.isSending.set(false);
    this.service.error.set(null);
    this.closed.emit();
  }
}

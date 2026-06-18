import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationAudioService, NotificationAudioSettings } from './notification-audio.service';

@Component({
  selector: 'app-notification-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <div class="notification-settings">
      <mat-card class="sound-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>notifications</mat-icon>
          <mat-card-title>Notification Sounds</mat-card-title>
          <mat-card-subtitle>Configure how you hear real-time alerts</mat-card-subtitle>
        </mat-card-header>
        <mat-divider />
        <mat-card-content>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Sound Enabled</span>
              <span class="setting-hint">Play a chime for new announcements and alerts</span>
            </div>
            <mat-slide-toggle
              [checked]="audio.settings().enabled"
              (change)="audio.updateSettings({ enabled: $event.checked })"
              color="primary" />
          </div>
          <mat-divider />
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Volume</span>
              <span class="setting-hint">{{ audio.settings().volume }}%</span>
            </div>
            <mat-slider min="0" max="100" step="5" class="volume-slider">
              <input
                matSliderThumb
                [value]="audio.settings().volume"
                (valueChange)="audio.updateSettings({ volume: $event })" />
            </mat-slider>
          </div>
          <mat-divider />
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Alert Profile</span>
              <span class="setting-hint">Which events trigger sound</span>
            </div>
            <mat-select
              [value]="audio.settings().profile"
              (selectionChange)="audio.updateSettings({ profile: $event.value })"
              class="profile-select">
              <mat-option value="standard">Standard — all alerts</mat-option>
              <mat-option value="critical_only">Critical only — urgent alerts</mat-option>
              <mat-option value="silent">Silent — no sounds</mat-option>
            </mat-select>
          </div>
        </mat-card-content>
        <mat-divider />
        <mat-card-actions>
          <button mat-stroked-button color="warn" (click)="audio.resetSettings()">
            <mat-icon>restart_alt</mat-icon>
            Reset to Defaults
          </button>
          <div class="action-spacer"></div>
          <button mat-stroked-button (click)="audio.playAlert()">
            <mat-icon>play_arrow</mat-icon>
            Test Alert
          </button>
          <button mat-stroked-button (click)="audio.playCriticalAlert()">
            <mat-icon>warning</mat-icon>
            Test Critical
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .notification-settings { padding: 24px 0; max-width: 640px; }
    .sound-card { border-radius: 12px; }
    .sound-card mat-card-header { padding-top: 16px; }
    .sound-card mat-card-avatar { color: #6366f1; }
    .sound-card mat-card-content { padding: 0; }
    .sound-card mat-card-actions {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
    }
    .action-spacer { flex: 1; }
    .setting-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; gap: 16px;
    }
    .setting-info { display: flex; flex-direction: column; gap: 2px; }
    .setting-label { font-size: 0.9rem; font-weight: 500; color: #111827; }
    .setting-hint { font-size: 0.78rem; color: #6b7280; }
    .volume-slider { width: 200px; }
    .profile-select { width: 240px; }
  `],
})
export class NotificationSettingsComponent {
  readonly audio = inject(NotificationAudioService);
}

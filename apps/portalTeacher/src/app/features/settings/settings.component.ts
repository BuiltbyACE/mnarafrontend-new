import { Component, signal, computed, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@sms/core/auth';
import { TeacherSettingsService } from '../../core/services/teacher-settings.service';
import { AvatarUploadService } from '@sms/core/avatar';

@Component({
  selector: 'app-teacher-settings',
  standalone: true,
  imports: [
    NgClass,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings-container">
      <header class="page-header">
        <h1>Settings</h1>
        <p class="subtitle">Manage your profile, security, and preferences</p>
      </header>

      <section class="settings-section">
        <h2 class="section-title">
          <mat-icon>person</mat-icon>
          Profile Settings
        </h2>
        <mat-card class="settings-card" appearance="outlined">
          <mat-card-content>
            <div class="profile-header-row">
              <div class="avatar-wrapper" (click)="fileInput.click()" [class.uploading]="avatarUpload.isUploading()">
                @if (avatarUpload.previewUrl(); as preview) {
                  <img [src]="preview" class="avatar-img" alt="Preview" />
                } @else if (authStore.avatarUrl(); as url) {
                  <img [src]="url" class="avatar-img" alt="Avatar" />
                } @else {
                  <div class="avatar-fallback">{{ initials() }}</div>
                }
                <div class="avatar-overlay">
                  <mat-icon class="camera-icon">photo_camera</mat-icon>
                </div>
              </div>
              <div class="avatar-info">
                <span class="avatar-name">{{ profile().name }}</span>
                <span class="avatar-hint">Click to change photo</span>
                @if (avatarUpload.isUploading()) {
                  <span class="upload-status uploading">Uploading…</span>
                }
                @if (avatarUpload.error(); as err) {
                  <span class="upload-status error">{{ err }}</span>
                }
                @if (avatarUpload.lastResult(); as result) {
                  <span class="upload-status success">Photo updated</span>
                }
              </div>
            </div>
            <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" class="file-input" (change)="onFileSelected($event)" />
            <div class="profile-fields">
              <div class="field">
                <span class="field-label">Name</span>
                <span class="field-value">{{ profile().name }}</span>
              </div>
              <div class="field">
                <span class="field-label">Email</span>
                <span class="field-value">{{ profile().email }}</span>
              </div>
              <div class="field">
                <span class="field-label">Phone</span>
                <span class="field-value">{{ profile().phone }}</span>
              </div>
              <div class="field">
                <span class="field-label">Department</span>
                <span class="field-value">{{ profile().department }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="settings-section">
        <h2 class="section-title">
          <mat-icon>lock</mat-icon>
          Password Change
        </h2>
        <mat-card class="settings-card" appearance="outlined">
          <mat-card-content>
            <div class="password-fields">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Current Password</mat-label>
                <input matInput type="password" [(ngModel)]="passwordModel.current" />
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>New Password</mat-label>
                <input matInput type="password" [(ngModel)]="passwordModel.newPassword" />
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Confirm New Password</mat-label>
                <input matInput type="password" [(ngModel)]="passwordModel.confirm" />
              </mat-form-field>
            </div>
            <div class="section-actions">
              <button mat-raised-button color="primary" (click)="updatePassword()">
                <mat-icon>lock_reset</mat-icon>
                Update Password
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="settings-section">
        <h2 class="section-title">
          <mat-icon>notifications</mat-icon>
          Notification Preferences
        </h2>
        <mat-card class="settings-card" appearance="outlined">
          <mat-card-content>
            <div class="toggle-list">
              <div class="toggle-item">
                <span class="toggle-label">Email notifications</span>
                <mat-slide-toggle [(ngModel)]="notificationPrefs.email" color="primary" />
              </div>
              <mat-divider />
              <div class="toggle-item">
                <span class="toggle-label">SMS notifications</span>
                <mat-slide-toggle [(ngModel)]="notificationPrefs.sms" color="primary" />
              </div>
              <mat-divider />
              <div class="toggle-item">
                <span class="toggle-label">Assignment reminders</span>
                <mat-slide-toggle [(ngModel)]="notificationPrefs.assignmentReminders" color="primary" />
              </div>
              <mat-divider />
              <div class="toggle-item">
                <span class="toggle-label">Meeting reminders</span>
                <mat-slide-toggle [(ngModel)]="notificationPrefs.meetingReminders" color="primary" />
              </div>
              <mat-divider />
              <div class="toggle-item">
                <span class="toggle-label">Grade alerts</span>
                <mat-slide-toggle [(ngModel)]="notificationPrefs.gradeAlerts" color="primary" />
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="settings-section">
        <h2 class="section-title">
          <mat-icon>palette</mat-icon>
          Appearance
        </h2>
        <mat-card class="settings-card" appearance="outlined">
          <mat-card-content>
            <p class="appearance-placeholder">Theme customization coming soon</p>
            <div class="theme-preview">
              <div class="theme-swatch active" style="background:#2563eb"></div>
              <div class="theme-swatch" style="background:#059669"></div>
              <div class="theme-swatch" style="background:#7c3aed"></div>
              <div class="theme-swatch" style="background:#dc2626"></div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: `
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-dark: #1d4ed8;
      --mnara-primary-light: #dbeafe;
      --mnara-surface: #ffffff;
      --mnara-surface-hover: #f1f5f9;
      --mnara-background: #f0f4ff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      display: block;
      min-height: 100vh;
      background: var(--mnara-background);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--mnara-text);
    }
    .settings-container { max-width: 720px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { font-size: 28px; font-weight: 600; margin: 0 0 4px; }
    .subtitle { color: var(--mnara-text-secondary); font-size: 14px; margin: 0; }
    .settings-section { margin-bottom: 32px; }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 18px; font-weight: 600; margin: 0 0 12px;
    }
    .section-title mat-icon { color: var(--mnara-primary); font-size: 22px; width: 22px; height: 22px; }
    .settings-card { background: var(--mnara-surface); }

    .profile-header-row {
      display: flex; align-items: center; gap: 16px;
      padding-bottom: 20px; border-bottom: 1px solid var(--mnara-border); margin-bottom: 16px;
    }
    .avatar-wrapper {
      position: relative; width: 80px; height: 80px; border-radius: 50%;
      overflow: hidden; cursor: pointer; flex-shrink: 0;
      border: 3px solid var(--mnara-border);
      transition: border-color 0.2s, opacity 0.2s;
    }
    .avatar-wrapper:hover { border-color: var(--mnara-primary); }
    .avatar-wrapper.uploading { opacity: 0.6; pointer-events: none; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .avatar-fallback {
      width: 100%; height: 100%; border-radius: 50%;
      background: linear-gradient(135deg, var(--mnara-primary), var(--mnara-primary-dark));
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700;
    }
    .avatar-overlay {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s;
    }
    .avatar-wrapper:hover .avatar-overlay { opacity: 1; }
    .camera-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    .file-input { display: none; }
    .avatar-info { display: flex; flex-direction: column; gap: 2px; }
    .avatar-name { font-size: 1rem; font-weight: 600; }
    .avatar-hint { font-size: 0.75rem; color: var(--mnara-text-secondary); }
    .upload-status { font-size: 0.75rem; font-weight: 500; }
    .upload-status.uploading { color: var(--mnara-primary); }
    .upload-status.error { color: #ef4444; }
    .upload-status.success { color: #10b981; }

    .profile-fields { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 2px; }
    .field-label { font-size: 12px; color: var(--mnara-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
    .field-value { font-size: 16px; font-weight: 500; color: var(--mnara-text); }
    .section-actions { padding-top: 16px; }
    .password-fields { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
    .toggle-list { display: flex; flex-direction: column; }
    .toggle-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; }
    .toggle-label { font-size: 15px; font-weight: 500; color: var(--mnara-text); }
    .appearance-placeholder { font-size: 14px; color: var(--mnara-text-secondary); margin-bottom: 12px; }
    .theme-preview { display: flex; gap: 12px; }
    .theme-swatch {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid transparent; cursor: pointer;
      transition: border-color 0.15s;
    }
    .theme-swatch.active { border-color: var(--mnara-text); }
    .theme-swatch:hover { border-color: var(--mnara-primary); }
  `,
})
export class SettingsComponent {
  private settingsService = inject(TeacherSettingsService);
  readonly authStore = inject(AuthStore);
  readonly avatarUpload = inject(AvatarUploadService);

  readonly profile = computed(() =>
    this.settingsService.profile() ?? {
      name: 'Loading...',
      email: '',
      phone: '',
      department: '',
    }
  );

  readonly initials = computed(() =>
    this.profile().name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase()
  );

  passwordModel = {
    current: '',
    newPassword: '',
    confirm: '',
  };

  notificationPrefs = {
    email: true,
    sms: false,
    assignmentReminders: true,
    meetingReminders: true,
    gradeAlerts: true,
  };

  constructor() {
    this.settingsService.fetchProfile();
    effect(() => {
      const res = this.avatarUpload.lastResult();
      if (res) {
        this.authStore.updateAvatarUrl(res.photoUrl);
        this.settingsService.fetchProfile();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarUpload.reset();
    this.avatarUpload.setPreview(file);
    this.avatarUpload.upload(file);
    input.value = '';
  }

  updatePassword(): void {
    this.settingsService.changePassword({
      current_password: this.passwordModel.current,
      new_password: this.passwordModel.newPassword,
      confirm_password: this.passwordModel.confirm,
    });
  }
}

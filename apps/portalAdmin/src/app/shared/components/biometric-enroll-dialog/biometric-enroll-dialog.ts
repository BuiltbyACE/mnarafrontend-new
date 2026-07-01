import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpParams } from '@angular/common/http';
import { getApiUrl } from '@sms/core/config';
import { Subject, takeUntil, interval, switchMap, tap, filter, finalize } from 'rxjs';

export interface BiometricEnrollDialogData {
  userId: number;
  userName: string;
  schoolId: string;
  role: 'STUDENT' | 'TEACHER' | 'STAFF';
}

interface BiometricDevice {
  id: number;
  name: string;
  serial_number: string;
  device_type: string;
  location: string;
  status: string;
}

interface EnrollmentInfo {
  device_id: number;
  device_name: string;
  device_user_id: string;
  enrolled_modalities: string;
}

interface CommandStatus {
  id: number;
  status: string;
  command_type: string;
  error_message: string;
  sent_at: string | null;
  completed_at: string | null;
}

type EnrollPhase = 'idle' | 'selecting' | 'sending' | 'waiting' | 'success' | 'error';

@Component({
  selector: 'app-biometric-enroll-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="enroll-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
            <path d="M12 2a6 6 0 00-6 6c0 3.5 2.5 6 6 6s6-2.5 6-6a6 6 0 00-6-6z"/>
            <path d="M5 20c0-2.5 2.5-5 7-5s7 2.5 7 5"/>
            <circle cx="12" cy="16" r="1"/>
            <line x1="12" y1="10" x2="12" y2="13"/>
          </svg>
        </div>
        <div class="header-text">
          <h2>Biometric Enrollment</h2>
          <p class="header-sub">{{ data.userName }} · {{ data.schoolId }}</p>
        </div>
        <button class="close-btn" (click)="close()" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="dialog-body">
        <!-- Current enrollments -->
        <div class="section">
          <h3 class="section-title">Current Enrollment Status</h3>
          @if (enrollments().length === 0) {
            <div class="status-badge status-badge--none">
              <mat-icon>fingerprint</mat-icon>
              <span>Not enrolled on any device</span>
            </div>
          } @else {
            <div class="enrollment-list">
              @for (e of enrollments(); track e.device_id) {
                <div class="enrollment-item">
                  <mat-icon color="primary">check_circle</mat-icon>
                  <div class="enrollment-info">
                    <strong>{{ e.device_name }}</strong>
                    <span>PIN: {{ e.device_user_id }} · {{ getModalityLabel(e.enrolled_modalities) }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Enroll form -->
        @if (phase() !== 'success') {
          <div class="section">
            <h3 class="section-title">Enroll on Device</h3>

            @if (phase() === 'error') {
              <div class="error-box">
                <mat-icon color="warn">error</mat-icon>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="form-row">
              <label class="form-label">Device</label>
              <select [(ngModel)]="selectedDeviceId" class="form-select">
                @for (d of devices(); track d.id) {
                  <option [value]="d.id">
                    {{ d.name }} ({{ d.location }}) — {{ d.status }}
                  </option>
                }
              </select>
            </div>

            <div class="form-row">
              <label class="form-label">Modality</label>
              <select [(ngModel)]="selectedModality" class="form-select">
                <option value="face">Face Recognition</option>
                <option value="fingerprint">Fingerprint</option>
                <option value="multi">Multi-Modal</option>
                <option value="card">RFID Card</option>
                <option value="pin">PIN</option>
              </select>
            </div>

            <button
              class="enroll-btn"
              [disabled]="phase() === 'sending' || phase() === 'waiting'"
              (click)="startEnrollment()">
              @if (phase() === 'sending') {
                <mat-spinner diameter="18"></mat-spinner>
                Preparing...
              } @else if (phase() === 'waiting') {
                <mat-spinner diameter="18"></mat-spinner>
                Waiting for device...
              } @else {
                <mat-icon>fingerprint</mat-icon>
                Enroll on Device
              }
            </button>

            @if (phase() === 'waiting') {
              <div class="waiting-hint">
                <mat-icon>info</mat-icon>
                Have the user present their face or finger on the device now
              </div>
            }
          </div>
        }

        <!-- Success state -->
        @if (phase() === 'success') {
          <div class="success-section">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" width="48" height="48">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3>Enrolled Successfully!</h3>
            <p>
              <strong>{{ enrolledDeviceName() }}</strong> · PIN: <strong>{{ enrolledPin() }}</strong>
            </p>
            <p class="success-sub">User can now scan their biometric to sign in.</p>
            <button class="done-btn" (click)="close(true)">Done</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .enroll-dialog {
      font-family: 'Inter', sans-serif;
      width: 420px;
      max-width: 90vw;
      overflow: hidden;
    }
    .dialog-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .header-icon {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      display: flex; align-items: center; justify-content: center;
      svg { stroke: #fff; }
    }
    .header-text { flex: 1; }
    .header-text h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .header-sub { margin: 2px 0 0; font-size: 0.8125rem; color: #64748b; }
    .close-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none; flex-shrink: 0;
      background: #f1f5f9; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      svg { stroke: #64748b; }
      &:hover { background: #e2e8f0; svg { stroke: #334155; } }
    }

    .dialog-body { padding: 16px 24px 24px; }

    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 0.8rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.06em;
      margin: 0 0 10px;
    }

    .status-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: 8px; font-size: 0.875rem;
      &--none { background: #f1f5f9; color: #64748b; }
    }

    .enrollment-list { display: flex; flex-direction: column; gap: 8px; }
    .enrollment-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px;
      background: #f0fdf4; border: 1px solid #bbf7d0;
      .enrollment-info { display: flex; flex-direction: column; font-size: 0.8125rem; }
      strong { color: #166534; }
      span { color: #4ade80; }
    }

    .error-box {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 8px;
      background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
      font-size: 0.8125rem; margin-bottom: 12px;
    }

    .form-row { margin-bottom: 14px; }
    .form-label {
      display: block; font-size: 0.75rem; font-weight: 600; color: #374151;
      margin-bottom: 4px;
    }
    .form-select {
      width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 0.875rem; font-family: inherit;
      color: #1e293b; background: #fff; box-sizing: border-box;
      &:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
    }

    .enroll-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 11px 20px; border: none; border-radius: 10px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff; font-size: 0.875rem; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: all 0.15s;
      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.35); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .waiting-hint {
      display: flex; align-items: center; gap: 8px;
      margin-top: 10px; padding: 10px 14px; border-radius: 8px;
      background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb;
      font-size: 0.8125rem;
    }

    .success-section { text-align: center; padding: 16px 0; }
    .success-icon {
      margin: 0 auto 12px; width: 64px; height: 64px;
      background: #f0fdf4; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      svg { stroke: #16a34a; }
    }
    .success-section h3 { margin: 0 0 6px; font-size: 1.2rem; color: #166534; }
    .success-section p { margin: 0 0 4px; font-size: 0.875rem; color: #374151; }
    .success-sub { color: #64748b !important; }
    .done-btn {
      margin-top: 16px; padding: 10px 32px; border: none; border-radius: 10px;
      background: #16a34a; color: #fff; font-size: 0.875rem; font-weight: 700;
      cursor: pointer; font-family: inherit; transition: all 0.15s;
      &:hover { background: #15803d; }
    }
  `],
})
export class BiometricEnrollDialogComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject<MatDialogRef<BiometricEnrollDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<BiometricEnrollDialogData>(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  readonly devices = signal<BiometricDevice[]>([]);
  readonly enrollments = signal<EnrollmentInfo[]>([]);
  readonly phase = signal<EnrollPhase>('idle');
  readonly errorMessage = signal('');
  readonly enrolledDeviceName = signal('');
  readonly enrolledPin = signal('');

  selectedDeviceId: number | null = null;
  selectedModality = 'face';

  ngOnInit(): void {
    this.loadDevices();
    this.loadEnrollments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(result?: boolean): void {
    this.dialogRef.close(result ?? false);
  }

  private loadDevices(): void {
    this.http.get<BiometricDevice[]>(getApiUrl('/students/biometric/devices/')).subscribe({
      next: (devices) => {
        this.devices.set(devices);
        if (devices.length > 0 && !this.selectedDeviceId) {
          this.selectedDeviceId = devices[0].id;
        }
      },
      error: () => this.snackBar.open('Failed to load devices', 'Close', { duration: 3000 }),
    });
  }

  private loadEnrollments(): void {
    const params = new HttpParams().set('user_id', this.data.userId.toString());
    this.http.get<EnrollmentInfo[]>(getApiUrl('/students/biometric/enrollments/'), { params }).subscribe({
      next: (enrollments) => this.enrollments.set(enrollments),
    });
  }

  getModalityLabel(modality: string): string {
    const labels: Record<string, string> = {
      face: 'Face Recognition',
      fingerprint: 'Fingerprint',
      iris: 'Iris',
      card: 'RFID Card',
      pin: 'PIN',
      multi: 'Multi-Modal',
    };
    return labels[modality] || modality;
  }

  startEnrollment(): void {
    if (!this.selectedDeviceId) {
      this.snackBar.open('Please select a device', 'Close', { duration: 3000 });
      return;
    }

    this.phase.set('sending');
    this.errorMessage.set('');

    this.http.post<{ command_id: number; device_user_id: string; device_name: string }>(
      getApiUrl('/students/biometric/enroll/'),
      {
        user_id: this.data.userId,
        device_id: this.selectedDeviceId,
        enrolled_modalities: this.selectedModality,
      },
    ).pipe(
      tap((response) => {
        this.phase.set('waiting');
        this.enrolledPin.set(response.device_user_id);
        this.enrolledDeviceName.set(response.device_name);
      }),
      switchMap((response) =>
        interval(2000).pipe(
          switchMap(() =>
            this.http.get<CommandStatus>(
              getApiUrl(`/students/biometric/commands/${response.command_id}/`),
            )
          ),
          filter((cmd) => cmd.status === 'SUCCESS' || cmd.status === 'FAILED'),
          takeUntil(this.destroy$),
        )
      ),
      finalize(() => {
        if (this.phase() === 'sending') {
          this.phase.set('error');
          this.errorMessage.set('Failed to start enrollment');
        }
      }),
    ).subscribe({
      next: (cmd) => {
        if (cmd.status === 'SUCCESS') {
          this.phase.set('success');
          this.loadEnrollments();
        } else {
          this.phase.set('error');
          this.errorMessage.set(cmd.error_message || 'Device enrollment failed');
        }
      },
      error: (err) => {
        this.phase.set('error');
        if (err.status === 409) {
          this.errorMessage.set('User is already enrolled on this device');
          this.loadEnrollments();
        } else {
          this.errorMessage.set(err.error?.error || 'Failed to start enrollment');
        }
      },
    });
  }
}

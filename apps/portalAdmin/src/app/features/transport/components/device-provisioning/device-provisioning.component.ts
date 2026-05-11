import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { TransportService } from '../../services/transport.service';
import type { FleetVehicle } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-device-provisioning',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressBarModule, MatSnackBarModule, FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Provision New Tablet</h2>
    <mat-dialog-content>
      @if (submitting()) {
        <mat-progress-bar mode="indeterminate" class="dialog-progress"></mat-progress-bar>
      }

      @if (result(); as r) {
        <div class="result-section">
          <div class="result-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h3>Device Provisioned Successfully</h3>
          <div class="result-details">
            <div class="result-row">
              <span class="result-label">Device ID</span>
              <code class="result-value">{{ r.device_id }}</code>
            </div>
            <div class="result-row">
              <span class="result-label">PIN Code</span>
              <code class="result-value pin">{{ r.pin_code }}</code>
            </div>
            <div class="result-row">
              <span class="result-label">Vehicle</span>
              <span class="result-value">{{ selectedVehicleName() }}</span>
            </div>
          </div>
          <div class="link-section">
            <span class="link-label">Conductor Login Link</span>
            <div class="link-copy-row">
              <code class="login-link">{{ r.loginLink }}</code>
              <button mat-icon-button (click)="copyLink(r.loginLink)" matTooltip="Copy link">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div class="form-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>PIN Code</mat-label>
            <input matInput [(ngModel)]="pinCode" placeholder="Enter 4-8 digit PIN" maxlength="8" (input)="sanitizePin()">
            <mat-hint>Create a numeric PIN for conductor authentication</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Assign Vehicle</mat-label>
            <mat-select [(ngModel)]="selectedVehicleId">
              <mat-option [value]="null">— Select Vehicle —</mat-option>
              @for (v of vehicles(); track v.id) {
                <mat-option [value]="v.id">{{ v.registration_number }} ({{ v.capacity }} seats)</mat-option>
              }
            </mat-select>
            @if (vehicles().length === 0) {
              <mat-hint>Loading vehicles...</mat-hint>
            }
          </mat-form-field>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="submitting()">Cancel</button>
      @if (result()) {
        <button mat-raised-button color="primary" [mat-dialog-close]="result()">Done</button>
      } @else {
        <button mat-raised-button color="primary" (click)="provision()" [disabled]="!canSubmit() || submitting()">
          {{ submitting() ? 'Provisioning...' : 'Provision Device' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-progress { margin-bottom: 16px; border-radius: 4px; }
    .form-section { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
    .full-width { width: 100%; }

    .result-section { text-align: center; padding: 16px 0; }
    .result-icon mat-icon { font-size: 48px; width: 48px; height: 48px; color: #10b981; }
    .result-section h3 { margin: 12px 0 16px; font-size: 1.1rem; color: #1e293b; }
    .result-details { display: flex; flex-direction: column; gap: 8px; text-align: left; background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .result-row { display: flex; justify-content: space-between; align-items: center; }
    .result-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .result-value { font-size: 0.85rem; color: #1e293b; font-weight: 500; }
    .result-value.pin { font-family: monospace; font-size: 1rem; font-weight: 700; letter-spacing: 3px; color: #1d4ed8; }
    code.result-value { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 0.75rem; }

    .link-section { text-align: left; }
    .link-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 8px; }
    .link-copy-row { display: flex; align-items: center; gap: 8px; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 8px 12px; }
    .login-link { flex: 1; font-size: 0.7rem; word-break: break-all; color: #1d4ed8; font-family: monospace; }
    .link-copy-row button { flex-shrink: 0; }
  `],
})
export class DeviceProvisioningComponent {
  private transportService = inject(TransportService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<DeviceProvisioningComponent>);

  readonly vehicles = signal<FleetVehicle[]>([]);
  readonly selectedVehicleId = signal<number | null>(null);
  readonly pinCode = signal('');
  readonly submitting = signal(false);
  readonly result = signal<{ device_id: string; pin_code: string; loginLink: string } | null>(null);

  readonly selectedVehicleName = computed(() => {
    const v = this.vehicles().find(v => v.id === this.selectedVehicleId());
    return v ? v.registration_number : '';
  });

  readonly canSubmit = computed(() => {
    return this.pinCode().length >= 4 && this.selectedVehicleId() !== null;
  });

  constructor() {
    this.loadVehicles();
  }

  private loadVehicles(): void {
    this.transportService.getVehicles().subscribe({
      next: (data) => this.vehicles.set(data.results),
    });
  }

  sanitizePin(): void {
    this.pinCode.set(this.pinCode().replace(/\D/g, '').slice(0, 8));
  }

  provision(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    this.transportService.generateDevicePin({
      pin_code: this.pinCode(),
      vehicle_id: this.selectedVehicleId(),
    }).subscribe({
      next: (response) => {
        this.submitting.set(false);
        const baseUrl = window.location.origin;
        const loginLink = `${baseUrl}/conductor-login?device=${response.device_id}&pin=${response.pin_code}`;
        this.result.set({ ...response, loginLink });
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err.message || 'Failed to provision device', 'Close', { duration: 5000 });
      },
    });
  }

  copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Link copied to clipboard', 'Close', { duration: 3000 });
    });
  }
}

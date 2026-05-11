import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TransportService } from '../../services/transport.service';
import { DeviceProvisioningComponent } from '../device-provisioning/device-provisioning.component';
import type { FleetDevice } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-device-manager',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatChipsModule, MatTooltipModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <mat-card class="device-manager-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>tablet</mat-icon> Fleet Device Management
        </mat-card-title>
        <button mat-raised-button color="primary" (click)="provisionNewDevice()">
          <mat-icon>add</mat-icon> Provision New Tablet
        </button>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <div class="loading-row">
            <mat-icon>hourglass_top</mat-icon> Loading devices...
          </div>
        } @else {
          <div class="table-wrapper">
            <table mat-table [dataSource]="devices()" class="device-table">
              <ng-container matColumnDef="device_id">
                <th mat-header-cell *matHeaderCellDef>Device ID</th>
                <td mat-cell *matCellDef="let d">
                  <code class="device-id-cell">{{ d.device_id }}</code>
                </td>
              </ng-container>

              <ng-container matColumnDef="vehicle">
                <th mat-header-cell *matHeaderCellDef>Assigned Vehicle</th>
                <td mat-cell *matCellDef="let d">
                  @if (d.vehicle_name) {
                    <span>{{ d.vehicle_name }}</span>
                  } @else {
                    <span class="unassigned">Unassigned</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="pin">
                <th mat-header-cell *matHeaderCellDef>PIN Code</th>
                <td mat-cell *matCellDef="let d">
                  <code class="pin-cell">{{ d.pin_code || '—' }}</code>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let d">
                  <mat-chip [class]="d.is_active ? 'chip-active' : 'chip-inactive'" selected>
                    {{ d.is_active ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="last_ping">
                <th mat-header-cell *matHeaderCellDef>Last Ping</th>
                <td mat-cell *matCellDef="let d">
                  @if (d.last_ping) {
                    <span class="ping-cell" [class.stale]="isStale(d.last_ping)">
                      <span class="ping-dot" [class.stale]="isStale(d.last_ping)"></span>
                      {{ d.last_ping | date:'short' }}
                    </span>
                  } @else {
                    <span class="never-pinged">Never</span>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              @if (devices().length === 0) {
                <tr class="mat-row no-data-row">
                  <td [attr.colspan]="displayedColumns.length" class="mat-cell no-data-cell">
                    <div class="empty-devices">
                      <mat-icon>tablet_android</mat-icon>
                      <p>No fleet devices registered. Provision your first tablet.</p>
                    </div>
                  </td>
                </tr>
              }
            </table>
          </div>
        }
      </mat-card-content>
      @if (generatedLink(); as link) {
        <div class="qr-section">
          <div class="qr-header">
            <mat-icon>qr_code_2</mat-icon>
            <span>Device Link Generated</span>
            <button mat-icon-button (click)="generatedLink.set(null)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="qr-body">
            <code class="qr-link">{{ link }}</code>
            <button mat-stroked-button (click)="copyLink(link)">
              <mat-icon>content_copy</mat-icon> Copy Link
            </button>
          </div>
        </div>
      }
    </mat-card>
  `,
  styles: [`
    .device-manager-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .device-manager-card mat-card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; flex-wrap: wrap; gap: 12px; }
    .device-manager-card mat-card-title { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .device-manager-card mat-card-title mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .device-manager-card mat-card-content { padding: 0 24px 16px; }

    .loading-row { display: flex; align-items: center; gap: 8px; padding: 32px 0; justify-content: center; color: #94a3b8; font-size: 0.875rem; }

    .table-wrapper { overflow-x: auto; }
    .device-table { width: 100%; border-collapse: separate; border-spacing: 0; }
    .device-table th { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 8px; border-bottom: 2px solid #e2e8f0; }
    .device-table td { padding: 12px 8px; font-size: 0.8rem; border-bottom: 1px solid #f1f5f9; }
    .device-id-cell { font-size: 0.7rem; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; color: #475569; font-family: monospace; }
    .pin-cell { font-size: 0.85rem; font-weight: 700; color: #1e293b; letter-spacing: 2px; font-family: monospace; }
    .unassigned { color: #94a3b8; font-style: italic; font-size: 0.75rem; }
    .chip-active { background: #dcfce7 !important; color: #059669 !important; font-size: 0.65rem !important; height: 22px !important; }
    .chip-inactive { background: #f3f4f6 !important; color: #6b7280 !important; font-size: 0.65rem !important; height: 22px !important; }
    .ping-cell { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #475569; }
    .ping-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0; }
    .ping-dot.stale { background: #ef4444; }
    .ping-cell.stale { color: #dc2626; }
    .never-pinged { color: #94a3b8; font-size: 0.75rem; font-style: italic; }
    .no-data-row td { padding: 0; }
    .empty-devices { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 24px; color: #94a3b8; }
    .empty-devices mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.5; }
    .empty-devices p { margin: 0; font-size: 0.875rem; }

    .qr-section { margin: 0 24px 16px; border: 1px solid #dbeafe; border-radius: 8px; background: #eff6ff; overflow: hidden; }
    .qr-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #dbeafe; color: #1d4ed8; font-size: 0.8rem; font-weight: 600; }
    .qr-header mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .qr-header button { margin-left: auto; }
    .qr-body { display: flex; align-items: center; gap: 12px; padding: 16px; flex-wrap: wrap; }
    .qr-link { flex: 1; font-size: 0.7rem; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; word-break: break-all; color: #1e293b; font-family: monospace; min-width: 0; }
    .qr-body button { flex-shrink: 0; font-size: 0.75rem; }
    .qr-body button mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class DeviceManagerComponent {
  private transportService = inject(TransportService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly devices = signal<FleetDevice[]>([]);
  readonly loading = signal(false);
  readonly generatedLink = signal<string | null>(null);
  readonly displayedColumns = ['device_id', 'vehicle', 'pin', 'status', 'last_ping'];

  constructor() {
    this.loadDevices();
  }

  private loadDevices(): void {
    this.loading.set(true);
    this.transportService.getFleetDevices().subscribe({
      next: (data) => {
        this.devices.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  provisionNewDevice(): void {
    this.dialog.open(DeviceProvisioningComponent, {
      width: '500px',
      disableClose: true,
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.loadDevices();
        this.generatedLink.set(result.loginLink || null);
      }
    });
  }

  copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Link copied to clipboard', 'Close', { duration: 3000 });
    });
  }

  isStale(ping: string | null): boolean {
    if (!ping) return true;
    const diff = Date.now() - new Date(ping).getTime();
    return diff > 5 * 60 * 1000;
  }
}

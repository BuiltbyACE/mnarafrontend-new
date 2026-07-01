import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { getApiUrl } from '@sms/core/config';

interface UnmappedScan {
  id: number;
  device: number;
  device_name: string;
  device_location: string;
  device_user_id: string;
  scanned_at: string;
  received_at: string;
  status: string;
  notes: string;
}

@Component({
  selector: 'app-unassigned-scans',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="header">
        <h1>
          <mat-icon>fingerprint</mat-icon>
          Unassigned Biometric Scans
        </h1>
        <span class="count">{{ scans().length }} pending</span>
        <div class="spacer"></div>
        <button mat-stroked-button (click)="refresh()" class="refresh-btn">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-icon>hourglass_top</mat-icon> Loading scans...
        </div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon> {{ error() }}
        </div>
      } @else if (scans().length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle</mat-icon>
          <h2>All Clear</h2>
          <p>All biometric scans have been assigned to users.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Device</th>
                <th>Device User ID</th>
                <th>Scanned At</th>
                <th>Received At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (scan of scans(); track scan.id) {
                <tr>
                  <td>
                    <span class="device-name">{{ scan.device_name }}</span>
                    <span class="device-location">{{ scan.device_location }}</span>
                  </td>
                  <td><code>{{ scan.device_user_id }}</code></td>
                  <td class="time">{{ scan.scanned_at | date:'MMM d, y, h:mm a' }}</td>
                  <td class="time">{{ scan.received_at | date:'MMM d, y, h:mm a' }}</td>
                  <td class="actions-cell">
                    <button mat-stroked-button class="assign-btn" (click)="openAssignDialog(scan)">
                      <mat-icon>person_add</mat-icon> Assign
                    </button>
                    <button mat-stroked-button class="ignore-btn" (click)="ignoreScan(scan)">
                      <mat-icon>delete_outline</mat-icon> Ignore
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 24px 32px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header h1 mat-icon { color: #60a5fa; }
    .count {
      font-size: 12px;
      font-weight: 600;
      background: rgba(239,68,68,.15);
      color: #f87171;
      padding: 4px 12px;
      border-radius: 100px;
    }
    .spacer { flex: 1; }
    .refresh-btn {
      color: #94a3b8 !important;
      border-color: #1e293b !important;
    }

    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: #64748b;
      gap: 12px;
      text-align: center;
    }
    .loading-state mat-icon, .error-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; color: #22c55e; }
    .empty-state h2 { color: #e2e8f0; margin: 0; font-size: 18px; }
    .empty-state p { margin: 0; font-size: 14px; }
    .error-state mat-icon { color: #ef4444; }

    .table-wrap {
      background: #131c31;
      border: 1px solid #1e293b;
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .5px;
      color: #64748b;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
    }
    td {
      padding: 14px 16px;
      font-size: 13px;
      color: #e2e8f0;
      border-bottom: 1px solid #1e293b;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: rgba(255,255,255,.02); }

    .device-name { display: block; font-weight: 600; }
    .device-location { display: block; font-size: 11px; color: #64748b; }
    code {
      background: #1e293b;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'SF Mono', 'Cascadia Code', monospace;
      font-size: 12px;
    }
    .time { font-size: 12px; color: #94a3b8; font-family: 'SF Mono', 'Cascadia Code', monospace; }

    .actions-cell {
      display: flex;
      gap: 6px;
    }
    .assign-btn {
      color: #4ade80 !important;
      border-color: rgba(74,222,128,.3) !important;
      font-size: 12px !important;
    }
    .assign-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .ignore-btn {
      color: #f87171 !important;
      border-color: rgba(248,113,113,.3) !important;
      font-size: 12px !important;
    }
    .ignore-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class UnassignedScansComponent implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  readonly scans = signal<UnmappedScan[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<UnmappedScan[]>(getApiUrl('/students/biometric/unmapped-scans/'))
      .subscribe({
        next: (data) => { this.scans.set(data); this.loading.set(false); },
        error: () => { this.error.set('Failed to load scans'); this.loading.set(false); },
      });
  }

  async openAssignDialog(scan: UnmappedScan): Promise<void> {
    const { AssignUserDialogComponent } = await import('./assign-user-dialog.component');
    const ref = this.dialog.open(AssignUserDialogComponent, {
      width: '520px',
      data: { scan },
    });
    ref.afterClosed().subscribe((result) => {
      if (result === 'assigned') {
        this.refresh();
      }
    });
  }

  ignoreScan(scan: UnmappedScan): void {
    this.http.post(getApiUrl(`/students/biometric/unmapped-scans/${scan.id}/ignore/`), {})
      .subscribe({ next: () => this.refresh() });
  }
}

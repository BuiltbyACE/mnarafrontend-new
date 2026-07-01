import { Component, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { getApiUrl } from '@sms/core/config';

interface UnmappedScan {
  id: number;
  device_name: string;
  device_user_id: string;
  scanned_at: string;
}

interface UserResult {
  id: number;
  school_id: string;
  name: string;
  role: string;
}

@Component({
  selector: 'app-assign-user-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <div class="dialog">
      <div class="dialog-header">
        <h2><mat-icon>person_add</mat-icon> Assign Biometric Scan</h2>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>

      <div class="dialog-body">
        <div class="scan-info">
          <div class="info-row">
            <span class="label">Device</span>
            <span class="value">{{ data.scan.device_name }}</span>
          </div>
          <div class="info-row">
            <span class="label">Device User ID</span>
            <span class="value"><code>{{ data.scan.device_user_id }}</code></span>
          </div>
          <div class="info-row">
            <span class="label">Scanned At</span>
            <span class="value">{{ data.scan.scanned_at | date:'MMM d, y, h:mm a' }}</span>
          </div>
        </div>

        <div class="search-section">
          <label>Search User</label>
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input
              type="text"
              [(ngModel)]="query"
              (input)="search()"
              placeholder="Type at least 2 characters (name or school ID)..."
              class="search-input"
            />
            @if (searching()) {
              <mat-icon class="spin">hourglass_top</mat-icon>
            }
          </div>

          @if (results().length > 0) {
            <div class="results">
              @for (user of results(); track user.id) {
                <div class="result-row" [class.selected]="selectedUserId === user.id" (click)="selectUser(user)">
                  <div class="result-info">
                    <span class="result-name">{{ user.name }}</span>
                    <span class="result-id">{{ user.school_id }}</span>
                  </div>
                  <span class="result-role" [class]="user.role.toLowerCase()">{{ user.role }}</span>
                  @if (selectedUserId === user.id) {
                    <mat-icon class="check">check_circle</mat-icon>
                  }
                </div>
              }
            </div>
          } @else if (query().length >= 2 && !searching()) {
            <div class="no-results">No users found matching "{{ query() }}"</div>
          }
        </div>

        <div class="modality-section">
          <label>Enrolled Modality</label>
          <select [(ngModel)]="modality" class="modality-select">
            <option value="face">Face Recognition</option>
            <option value="fingerprint">Fingerprint</option>
            <option value="card">RFID Card</option>
            <option value="pin">PIN</option>
            <option value="multi">Multi-Modal</option>
          </select>
        </div>
      </div>

      <div class="dialog-footer">
        <button mat-stroked-button mat-dialog-close>Cancel</button>
        <button
          mat-flat-button
          [disabled]="!selectedUserId || searching()"
          (click)="assign()"
          class="assign-btn"
        >
          @if (searching()) {
            <mat-icon class="spin">hourglass_top</mat-icon> Assigning...
          } @else {
            <mat-icon>person_add</mat-icon> Assign & Record Attendance
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog {
      background: #0f172a;
      color: #e2e8f0;
      min-width: 480px;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #1e293b;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dialog-header h2 mat-icon { color: #60a5fa; }

    .dialog-body {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .scan-info {
      background: #131c31;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .info-row .label { color: #64748b; }
    .info-row .value { color: #e2e8f0; font-weight: 600; }
    code {
      background: #1e293b;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', monospace;
      font-size: 12px;
    }

    .search-section label, .modality-section label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .5px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #131c31;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 8px 12px;
    }
    .search-box mat-icon { color: #64748b; font-size: 20px; width: 20px; height: 20px; }
    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #e2e8f0;
      font-size: 13px;
    }
    .search-input::placeholder { color: #475569; }

    .results {
      margin-top: 8px;
      border: 1px solid #1e293b;
      border-radius: 8px;
      overflow: hidden;
    }
    .result-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background .1s;
      border-bottom: 1px solid #1e293b;
    }
    .result-row:last-child { border-bottom: none; }
    .result-row:hover { background: rgba(255,255,255,.03); }
    .result-row.selected { background: rgba(96,165,250,.1); }
    .result-info { flex: 1; }
    .result-name { display: block; font-size: 13px; font-weight: 600; color: #e2e8f0; }
    .result-id { display: block; font-size: 11px; color: #64748b; font-family: 'SF Mono', monospace; }
    .result-role {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .result-role.student { background: rgba(34,197,94,.15); color: #4ade80; }
    .result-role.staff { background: rgba(168,85,247,.15); color: #c084fc; }
    .result-role.teacher { background: rgba(59,130,246,.15); color: #60a5fa; }
    .check { color: #22c55e; font-size: 20px; width: 20px; height: 20px; }
    .no-results {
      margin-top: 8px;
      padding: 16px;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }

    .modality-section { margin-top: 16px; }
    .modality-select {
      width: 100%;
      background: #131c31;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 10px 12px;
      color: #e2e8f0;
      font-size: 13px;
      outline: none;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid #1e293b;
    }
    .assign-btn {
      background: #2563eb !important;
      color: #fff !important;
    }
    .assign-btn[disabled] { opacity: .4; }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `],
})
export class AssignUserDialogComponent {
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<AssignUserDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { scan: UnmappedScan };

  readonly query = signal('');
  readonly results = signal<UserResult[]>([]);
  readonly searching = signal(false);
  selectedUserId: number | null = null;
  modality = 'face';

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  search(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const q = this.query();
      if (q.length < 2) { this.results.set([]); return; }
      this.searching.set(true);
      this.http.get<UserResult[]>(getApiUrl(`/students/biometric/search-users/?q=${encodeURIComponent(q)}`))
        .subscribe({
          next: (data) => { this.results.set(data); this.searching.set(false); },
          error: () => { this.searching.set(false); },
        });
    }, 300);
  }

  selectUser(user: UserResult): void {
    this.selectedUserId = user.id;
  }

  assign(): void {
    if (!this.selectedUserId) return;
    this.searching.set(true);
    this.http.post(
      getApiUrl(`/students/biometric/unmapped-scans/${this.data.scan.id}/assign/`),
      { user_id: this.selectedUserId, enrolled_modalities: this.modality },
    ).subscribe({
      next: () => {
        this.dialogRef.close('assigned');
      },
      error: () => {
        this.searching.set(false);
      },
    });
  }
}

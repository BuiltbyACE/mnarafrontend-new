import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface AttendanceRecord {
  studentName: string;
  studentId: string;
  status: AttendanceStatus;
  date: string;
}

interface ClassOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [
    DatePipe, NgClass,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatDatepickerModule,
    MatTableModule, MatMenuModule, FormsModule,
  ],
  template: `
    <div class="attendance-page">
      <header class="page-header">
        <h1>Attendance Management</h1>
      </header>

      <div class="summary-cards">
        <mat-card class="summary-card total">
          <mat-card-content>
            <div class="summary-icon"><mat-icon>people</mat-icon></div>
            <div class="summary-data">
              <span class="summary-value">{{ summary().total }}</span>
              <span class="summary-label">Total Students</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card present">
          <mat-card-content>
            <div class="summary-icon"><mat-icon>check_circle</mat-icon></div>
            <div class="summary-data">
              <span class="summary-value">{{ summary().present }}</span>
              <span class="summary-label">Present Today</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card absent">
          <mat-card-content>
            <div class="summary-icon"><mat-icon>cancel</mat-icon></div>
            <div class="summary-data">
              <span class="summary-value">{{ summary().absent }}</span>
              <span class="summary-label">Absent</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card late">
          <mat-card-content>
            <div class="summary-icon"><mat-icon>schedule</mat-icon></div>
            <div class="summary-data">
              <span class="summary-value">{{ summary().late }}</span>
              <span class="summary-label">Late</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="filter-card">
        <mat-card-content class="filter-bar">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Class</mat-label>
            <mat-select [(ngModel)]="selectedClass">
              @for (c of classOptions; track c.value) {
                <mat-option [value]="c.value">{{ c.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" [(ngModel)]="selectedDate">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="markAttendance()">
            <mat-icon>fact_check</mat-icon>
            Mark Attendance
          </button>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-wrapper">
          <table mat-table [dataSource]="records()" class="attendance-table">
            <ng-container matColumnDef="studentName">
              <th mat-header-cell *matHeaderCellDef>Student Name</th>
              <td mat-cell *matCellDef="let r">{{ r.studentName }}</td>
            </ng-container>
            <ng-container matColumnDef="studentId">
              <th mat-header-cell *matHeaderCellDef>Student ID</th>
              <td mat-cell *matCellDef="let r" class="id-cell">{{ r.studentId }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span class="status-badge" [class]="r.status.toLowerCase()">
                  {{ r.status }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.date | date:'d MMM yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-icon-button [matMenuTriggerFor]="menu" (click)="selectedRecord.set(r)">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="updateStatus(r, 'PRESENT')">
                    <mat-icon style="color:#16a34a">check_circle</mat-icon> Present
                  </button>
                  <button mat-menu-item (click)="updateStatus(r, 'ABSENT')">
                    <mat-icon style="color:#dc2626">cancel</mat-icon> Absent
                  </button>
                  <button mat-menu-item (click)="updateStatus(r, 'LATE')">
                    <mat-icon style="color:#d97706">schedule</mat-icon> Late
                  </button>
                  <button mat-menu-item (click)="updateStatus(r, 'EXCUSED')">
                    <mat-icon style="color:#6366f1">info</mat-icon> Excused
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-light: #dbeafe;
      --mnara-primary-dark: #1e40af;
      --mnara-bg: #f1f5f9;
      --mnara-surface: #ffffff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      display: block;
      min-height: 100vh;
      background: var(--mnara-bg);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .attendance-page {
      padding: 32px;
      max-width: 1280px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 28px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--mnara-text);
      margin: 0;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .summary-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .summary-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .summary-card.total .summary-icon mat-icon { color: var(--mnara-primary); }
    .summary-card.present .summary-icon mat-icon { color: #16a34a; }
    .summary-card.absent .summary-icon mat-icon { color: #dc2626; }
    .summary-card.late .summary-icon mat-icon { color: #d97706; }
    .summary-data {
      display: flex;
      flex-direction: column;
    }
    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--mnara-text);
      line-height: 1.2;
    }
    .summary-label {
      font-size: 13px;
      color: var(--mnara-text-secondary);
    }
    .filter-card {
      margin-bottom: 24px;
      border-radius: 12px;
      border: 1px solid var(--mnara-border);
    }
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px 24px;
    }
    .filter-bar mat-form-field {
      min-width: 200px;
    }
    .table-card {
      border-radius: 12px;
      border: 1px solid var(--mnara-border);
      overflow: hidden;
    }
    .table-wrapper {
      padding: 0;
    }
    .attendance-table {
      width: 100%;
    }
    .attendance-table .mat-mdc-header-cell {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mnara-text-secondary);
      background: var(--mnara-bg);
      padding: 12px 16px;
      border-bottom: 2px solid var(--mnara-border);
    }
    .attendance-table .mat-mdc-cell {
      font-size: 14px;
      color: var(--mnara-text);
      padding: 12px 16px;
      border-bottom: 1px solid var(--mnara-border);
    }
    .id-cell {
      font-family: 'SF Mono', 'Cascadia Code', monospace;
      font-size: 13px;
      color: var(--mnara-text-secondary);
    }
    .status-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-badge.present {
      background: #dcfce7;
      color: #15803d;
    }
    .status-badge.absent {
      background: #fee2e2;
      color: #b91c1c;
    }
    .status-badge.late {
      background: #fef3c7;
      color: #b45309;
    }
    .status-badge.excused {
      background: #e0e7ff;
      color: #4338ca;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceComponent {
  readonly selectedClass = signal<string>('form-2a');
  readonly selectedDate = signal<Date>(new Date());
  readonly selectedRecord = signal<AttendanceRecord | null>(null);

  readonly displayedColumns = ['studentName', 'studentId', 'status', 'date', 'actions'];

  readonly classOptions: ClassOption[] = [
    { value: 'form-1a', label: 'Form 1A' },
    { value: 'form-1b', label: 'Form 1B' },
    { value: 'form-1c', label: 'Form 1C' },
    { value: 'form-2a', label: 'Form 2A' },
    { value: 'form-2b', label: 'Form 2B' },
    { value: 'form-3a', label: 'Form 3A' },
    { value: 'form-3b', label: 'Form 3B' },
    { value: 'form-4a', label: 'Form 4A' },
  ];

  private readonly mockStudents: AttendanceRecord[] = [
    { studentName: 'Amara Okafor', studentId: 'STU-001', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Brian Mwangi', studentId: 'STU-002', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Catherine Wanjiku', studentId: 'STU-003', status: 'LATE', date: '2025-06-13' },
    { studentName: 'David Kimani', studentId: 'STU-004', status: 'ABSENT', date: '2025-06-13' },
    { studentName: 'Esther Akinyi', studentId: 'STU-005', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Francis Njoroge', studentId: 'STU-006', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Grace Achieng', studentId: 'STU-007', status: 'EXCUSED', date: '2025-06-13' },
    { studentName: 'Henry Kamau', studentId: 'STU-008', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Irene Nyambura', studentId: 'STU-009', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'James Otieno', studentId: 'STU-010', status: 'LATE', date: '2025-06-13' },
    { studentName: 'Khadija Hassan', studentId: 'STU-011', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Lucas Mutua', studentId: 'STU-012', status: 'ABSENT', date: '2025-06-13' },
    { studentName: 'Mary Wambui', studentId: 'STU-013', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Nathan Kiplagat', studentId: 'STU-014', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Olivia Akinyi', studentId: 'STU-015', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Peter Mbugua', studentId: 'STU-016', status: 'EXCUSED', date: '2025-06-13' },
    { studentName: 'Queen Adhiambo', studentId: 'STU-017', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Ronald Kiprop', studentId: 'STU-018', status: 'LATE', date: '2025-06-13' },
    { studentName: 'Sarah Chebet', studentId: 'STU-019', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Timothy Ndegwa', studentId: 'STU-020', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Ursula Mueni', studentId: 'STU-021', status: 'ABSENT', date: '2025-06-13' },
    { studentName: 'Victor Barasa', studentId: 'STU-022', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Winnie Jeruto', studentId: 'STU-023', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Xavier Odhiambo', studentId: 'STU-024', status: 'LATE', date: '2025-06-13' },
    { studentName: 'Yvonne Kamene', studentId: 'STU-025', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Zachary Mwangi', studentId: 'STU-026', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Aisha Mohamed', studentId: 'STU-027', status: 'PRESENT', date: '2025-06-13' },
    { studentName: 'Boniface Kipkorir', studentId: 'STU-028', status: 'EXCUSED', date: '2025-06-13' },
  ];

  readonly records = signal<AttendanceRecord[]>(this.mockStudents);

  readonly summary = signal({
    total: 28,
    present: 18,
    absent: 3,
    late: 4,
  });

  markAttendance(): void {
    const name = `Mark attendance for ${this.selectedClass()} on ${this.selectedDate()?.toLocaleDateString()}`;
    alert(name);
    console.log(name);
  }

  updateStatus(record: AttendanceRecord, status: AttendanceStatus): void {
    this.records.update(records =>
      records.map(r =>
        r.studentId === record.studentId ? { ...r, status } : r
      )
    );
    this.updateSummary();
  }

  private updateSummary(): void {
    const records = this.records();
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    this.summary.set({ total: records.length, present, absent, late });
  }
}

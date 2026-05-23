import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { StudentsService } from '../../../../features/students/services/students.service';
import type { DailyTrip, TripManifest } from '../../../../shared/models/transport.models';

interface StudentVM {
  id: number;
  name: string;
  admission: string;
  selected: boolean;
  existingManifestId?: number;
}

@Component({
  selector: 'app-assign-students-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDialogModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Assign Students — {{ data.vehicleName }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="search-field">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [(ngModel)]="search" placeholder="Search students..." (input)="applyFilter()">
      </mat-form-field>

      <div class="student-list">
        @if (loading()) {
          <div class="loading-row"><mat-icon>hourglass_top</mat-icon> Loading students...</div>
        } @else if (filtered().length === 0) {
          <div class="empty-row"><mat-icon>people</mat-icon> No students found</div>
        } @else {
          <div class="select-all-row">
            <mat-checkbox
              [checked]="allSelected()"
              [indeterminate]="someSelected()"
              (change)="toggleAll()">
              Select All ({{ filtered().length }})
            </mat-checkbox>
            <span class="selected-count">{{ selectedCount() }} selected</span>
          </div>

          @for (s of filtered(); track s.id) {
            <div class="student-row" [class.already-assigned]="!!s.existingManifestId">
              <mat-checkbox [(ngModel)]="s.selected" [disabled]="!!s.existingManifestId" />
              <div class="student-info">
                <span class="student-name">{{ s.name }}</span>
                <span class="student-adm">{{ s.admission }}</span>
              </div>
              @if (s.existingManifestId) {
                <span class="assigned-badge">Assigned</span>
              }
            </div>
          }
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="selectedCount() === 0" (click)="save()">
        Assign ({{ selectedCount() }})
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .search-field { width: 100%; margin-bottom: 8px; }
    .student-list { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; min-width: 420px; }
    .loading-row, .empty-row { display: flex; align-items: center; gap: 8px; padding: 24px; justify-content: center; color: #64748b; font-size: 0.875rem; }
    .select-all-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 4px; border-bottom: 1px solid #e2e8f0; margin-bottom: 4px; font-size: 0.875rem; }
    .selected-count { font-size: 0.75rem; color: #64748b; }
    .student-row { display: flex; align-items: center; gap: 12px; padding: 8px 4px; border-radius: 6px; }
    .student-row:hover { background: #f8fafc; }
    .student-row.already-assigned { opacity: 0.5; }
    .student-info { flex: 1; display: flex; flex-direction: column; }
    .student-name { font-size: 0.875rem; font-weight: 500; color: #0f172a; }
    .student-adm { font-size: 0.75rem; color: #64748b; }
    .assigned-badge { font-size: 0.6875rem; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  `],
})
export class AssignStudentsDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<AssignStudentsDialog>);
  private studentsService = inject(StudentsService);
  readonly data: { tripId: string; vehicleName: string; existingManifests: TripManifest[] } = inject(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly search = signal('');
  readonly allStudents = signal<StudentVM[]>([]);
  readonly filtered = signal<StudentVM[]>([]);

  ngOnInit(): void {
    this.studentsService.getProfiles(1, 500).subscribe({
      next: (res) => {
        const existing = new Map(this.data.existingManifests.map((m) => [m.student, m]));
        const list: StudentVM[] = (res.results || []).map((s) => {
          const match = existing.get(s.id);
          return {
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            admission: s.user_school_id || '',
            selected: !!match,
            existingManifestId: match?.id,
          };
        });
        this.allStudents.set(list);
        this.filtered.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter(): void {
    const q = this.search().toLowerCase();
    this.filtered.set(
      this.allStudents().filter((s) => s.name.toLowerCase().includes(q) || s.admission.toLowerCase().includes(q)),
    );
  }

  allSelected(): boolean {
    const f = this.filtered();
    return f.length > 0 && f.every((s) => s.selected || s.existingManifestId);
  }

  someSelected(): boolean {
    const f = this.filtered();
    return f.some((s) => s.selected) && !this.allSelected();
  }

  selectedCount(): number {
    return this.allStudents().filter((s) => s.selected && !s.existingManifestId).length;
  }

  toggleAll(): void {
    const newVal = !this.allSelected();
    for (const s of this.filtered()) {
      if (!s.existingManifestId) s.selected = newVal;
    }
  }

  save(): void {
    const selected = this.allStudents()
      .filter((s) => s.selected && !s.existingManifestId)
      .map((s) => s.id);
    this.dialogRef.close(selected);
  }
}

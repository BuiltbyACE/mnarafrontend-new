/**
 * Edit Classroom Dialog
 * PATCH /api/v1/academics/classrooms/{id}/ — flat write, soft-delete via is_active flag
 */

import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AcademicsService } from '../../services/academics.service';
import { Classroom, ClassroomWritePayload, YearLevel } from '../../../../shared/models/academics.models';

@Component({
  selector: 'app-edit-classroom-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit Classroom</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label for="name">Class Name</label>
          <input id="name" formControlName="name" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <span class="error-text">Class name is required</span>
          }
        </div>

        <div class="form-field">
          <label for="year_level">Year Level</label>
          <select id="year_level" formControlName="year_level">
            <option [ngValue]="null" disabled>Select year level</option>
            @for (yl of yearLevels; track yl.id) {
              <option [ngValue]="yl.id">{{ yl.name }}</option>
            }
          </select>
          @if (form.get('year_level')?.hasError('required') && form.get('year_level')?.touched) {
            <span class="error-text">Year level is required</span>
          }
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="room_number">Room Number</label>
            <input id="room_number" formControlName="room_number" />
          </div>
          <div class="form-field">
            <label for="capacity">Capacity</label>
            <input id="capacity" type="number" formControlName="capacity" min="1" />
            @if (form.get('capacity')?.hasError('min')) {
              <span class="error-text">Must be at least 1</span>
            }
          </div>
        </div>

        <mat-divider style="margin: 8px 0;"></mat-divider>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="is_active" color="primary">
            Active
          </mat-slide-toggle>
          <span class="toggle-hint">Deactivating sends <code>PATCH {{ '{' }} "is_active": false {{ '}' }}</code> — data is retained</span>
        </div>

        @if (errorMessage) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage }}</span>
          </div>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="saving">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || saving">
        @if (saving) {
          <mat-spinner diameter="18" style="display:inline-block; margin-right: 8px;"></mat-spinner>
        }
        Save Changes
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 16px; min-width: 460px; padding-top: 8px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 14px; font-weight: 500; color: #374151; }
    .form-field input,
    .form-field select {
      width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: 14px; color: #1f2937; background: #fff; transition: border-color 0.15s; box-sizing: border-box;
    }
    .form-field input:focus,
    .form-field select:focus {
      outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
    }
    .form-field input.ng-invalid.ng-touched,
    .form-field select.ng-invalid.ng-touched { border-color: #ef4444; }
    .error-text { font-size: 12px; color: #ef4444; }
    .toggle-row { display: flex; align-items: center; gap: 16px; padding: 8px 0; }
    .toggle-hint { font-size: 12px; color: #6b7280; }
    code { background: #f3f4f6; padding: 1px 4px; border-radius: 4px; font-size: 11px; }
    .error-banner { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fee2e2; border-radius: 8px; color: #dc2626; font-size: 14px; }
    mat-dialog-actions { padding: 16px 24px; }
  `],
})
export class EditClassroomDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly academicsService = inject(AcademicsService);
  readonly dialogRef = inject(MatDialogRef<EditClassroomDialogComponent>);
  readonly data = inject<{ classroom: Classroom }>(MAT_DIALOG_DATA);

  saving = false;
  errorMessage = '';
  yearLevels: YearLevel[] = [];

  form = this.fb.group({
    name: [this.data.classroom.name, Validators.required],
    year_level: [null as number | null, Validators.required],
    room_number: [this.data.classroom.room_number || ''],
    capacity: [this.data.classroom.capacity, [Validators.min(1)]],
    is_active: [this.data.classroom.is_active],
  });

  ngOnInit(): void {
    this.academicsService.getAcademicYears().subscribe({
      next: (res: any) => {
        const levels = res.results || [];
        this.yearLevels = levels;
        // Match year level by name since classroom returns name not id
        const matched = levels.find((l: YearLevel) => l.name === this.data.classroom.year_level_name);
        if (matched) {
          this.form.patchValue({ year_level: matched.id });
        }
      },
      error: () => {
        this.errorMessage = 'Could not load year levels.';
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.errorMessage = '';

    const v = this.form.getRawValue();
    const payload: ClassroomWritePayload = {
      name: v.name ?? '',
      year_level: (v.year_level ?? undefined) as number | undefined,
      room_number: v.room_number ?? '',
      capacity: v.capacity ?? 30,
      is_active: v.is_active ?? true,
    };
    this.academicsService.updateClassroom(this.data.classroom.id, payload).subscribe({
      next: (res: any) => this.dialogRef.close(true),
      error: (err: any) => {
        this.errorMessage = err.error?.detail || 'Failed to update classroom.';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

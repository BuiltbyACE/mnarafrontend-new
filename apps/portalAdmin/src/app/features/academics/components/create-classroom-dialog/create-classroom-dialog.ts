/**
 * Create Classroom Dialog
 * POST /api/v1/academics/classrooms/ — flat FK IDs per v2.0 contract
 */

import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AcademicsService } from '../../services/academics.service';
import { ClassroomWritePayload, YearLevel } from '../../../../shared/models/academics.models';

@Component({
  selector: 'app-create-classroom-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Classroom</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label for="name">Class Name</label>
          <input id="name" formControlName="name" placeholder="e.g. Form 1A" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <span class="error-text">Class name is required</span>
          }
        </div>

        <div class="form-field">
          <label for="year_level">Year Level</label>
          <select id="year_level" formControlName="year_level">
            <option [ngValue]="null" disabled>Select year level</option>
            @if (loadingYearLevels) {
              <option disabled>Loading year levels…</option>
            }
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
            <input id="room_number" formControlName="room_number" placeholder="e.g. B12" />
          </div>
          <div class="form-field">
            <label for="capacity">Capacity</label>
            <input id="capacity" type="number" formControlName="capacity" min="1" placeholder="e.g. 35" />
            @if (form.get('capacity')?.hasError('min')) {
              <span class="error-text">Capacity must be at least 1</span>
            }
          </div>
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
        Add Classroom
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
    .error-banner { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fee2e2; border-radius: 8px; color: #dc2626; font-size: 14px; }
    mat-dialog-actions { padding: 16px 24px; }
  `],
})
export class CreateClassroomDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly academicsService = inject(AcademicsService);
  readonly dialogRef = inject(MatDialogRef<CreateClassroomDialogComponent>);

  saving = false;
  loadingYearLevels = false;
  errorMessage = '';
  yearLevels: YearLevel[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    year_level: [null as number | null, Validators.required],
    room_number: [''],
    capacity: [30, [Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadingYearLevels = true;
    this.academicsService.getAcademicYears().subscribe({
      next: (res: any) => {
        const levels = res.results || [];
        this.yearLevels = levels.filter((l: YearLevel) => l.is_active);
        this.loadingYearLevels = false;
      },
      error: (err: any) => {
        this.loadingYearLevels = false;
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
    };
    this.academicsService.createClassroom(payload).subscribe({
      next: (res: any) => this.dialogRef.close(true),
      error: (err: any) => {
        this.errorMessage = err.error?.detail || err.error?.name?.[0] || 'Failed to create classroom.';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

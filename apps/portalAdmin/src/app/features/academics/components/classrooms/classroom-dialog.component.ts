import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Classroom } from '../../services/academics.service';

export interface ClassroomDialogData {
  isEdit: boolean;
  classroom?: Classroom;
}

@Component({
  selector: 'app-classroom-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Classroom</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label for="room_number">Room Number</label>
          <input id="room_number" formControlName="room_number" placeholder="e.g., A101" />
          @if (form.get('room_number')?.hasError('required')) {
            <span class="error-text">Room number is required</span>
          }
        </div>

        <div class="form-field">
          <label for="building">Building</label>
          <input id="building" formControlName="building" placeholder="e.g., Main Building" />
        </div>

        <div class="form-field">
          <label for="capacity">Capacity</label>
          <input id="capacity" type="number" formControlName="capacity" placeholder="e.g., 30" />
          @if (form.get('capacity')?.hasError('required')) {
            <span class="error-text">Capacity is required</span>
          }
          @if (form.get('capacity')?.hasError('min')) {
            <span class="error-text">Capacity must be at least 1</span>
          }
        </div>

        <div class="form-field">
          <label for="is_active">Status</label>
          <select id="is_active" formControlName="is_active">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" 
              [disabled]="form.invalid" 
              (click)="onSubmit()">
        {{ data.isEdit ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
      min-width: 400px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-field label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .form-field input,
    .form-field select {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      color: #1f2937;
      background: #fff;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }

    .form-field input:focus,
    .form-field select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
    }

    .form-field input.ng-invalid.ng-touched,
    .form-field select.ng-invalid.ng-touched {
      border-color: #ef4444;
    }

    .error-text {
      font-size: 12px;
      color: #ef4444;
    }
  `],
})
export class ClassroomDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClassroomDialogComponent>);
  data = inject<ClassroomDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      room_number: ['', Validators.required],
      building: [''],
      capacity: [0, [Validators.required, Validators.min(1)]],
      is_active: ['true'],
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.classroom) {
      this.form.patchValue({
        room_number: this.data.classroom.room_number,
        building: this.data.classroom.building,
        capacity: this.data.classroom.capacity,
        is_active: this.data.classroom.is_active ? 'true' : 'false',
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const value = { ...this.form.value, is_active: this.form.value.is_active === 'true' };
      this.dialogRef.close(value);
    }
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Classroom } from '../../services/academics.service';

export interface ClassroomDialogData {
  isEdit: boolean;
  classroom?: Classroom;
}

@Component({
  selector: 'app-classroom-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Add' }} Classroom</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Room Number</mat-label>
          <input matInput formControlName="room_number" placeholder="e.g., A101" />
          @if (form.get('room_number')?.hasError('required')) {
            <mat-error>Room number is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Building</mat-label>
          <input matInput formControlName="building" placeholder="e.g., Main Building" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Capacity</mat-label>
          <input matInput type="number" formControlName="capacity" placeholder="e.g., 30" />
          @if (form.get('capacity')?.hasError('required')) {
            <mat-error>Capacity is required</mat-error>
          }
          @if (form.get('capacity')?.hasError('min')) {
            <mat-error>Capacity must be at least 1</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="is_active">
            <mat-option [value]="true">Active</mat-option>
            <mat-option [value]="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
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

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 0;
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
      is_active: [true],
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.classroom) {
      this.form.patchValue({
        room_number: this.data.classroom.room_number,
        building: this.data.classroom.building,
        capacity: this.data.classroom.capacity,
        is_active: this.data.classroom.is_active,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

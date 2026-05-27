import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FacilityBooking } from '../../services/operations.service';

export interface FacilityBookingDialogData {
  isEdit: boolean;
  booking?: FacilityBooking;
}

@Component({
  selector: 'app-facility-booking-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'New' }} Facility Booking</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-row">
          <div class="form-field">
            <label class="input-label">Facility</label>
            <select formControlName="facility_name">
              <option value="">Select Facility</option>
              <option value="Main Hall">Main Hall</option>
              <option value="Sports Field">Sports Field</option>
              <option value="Library">Library</option>
              <option value="Computer Lab">Computer Lab</option>
              <option value="Science Lab">Science Lab</option>
              <option value="Auditorium">Auditorium</option>
            </select>
            @if (form.get('facility_name')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
          <div class="form-field">
            <label class="input-label">Status</label>
            <select formControlName="status">
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="input-label">Purpose</label>
          <textarea formControlName="purpose" rows="3" placeholder="Reason for booking..."></textarea>
          @if (form.get('purpose')?.hasError('required')) {
            <span class="error-text">Purpose is required</span>
          }
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="input-label">Start Time</label>
            <input type="datetime-local" formControlName="start_time" />
            @if (form.get('start_time')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
          <div class="form-field">
            <label class="input-label">End Time</label>
            <input type="datetime-local" formControlName="end_time" />
            @if (form.get('end_time')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
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
    .dialog-form { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; min-width: 480px; }
    .form-row { display: flex; gap: 16px; }
    .form-row .form-field { flex: 1; }
    .form-field { display: flex; flex-direction: column; gap: 4px; width: 100%; }
    .form-field input, .form-field select, .form-field textarea {
      width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; color: #1f2937; background: #fff; transition: border-color 0.15s;
      box-sizing: border-box; font-family: inherit;
    }
    .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
      outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
    }
    .form-field select { cursor: pointer; }
    .input-label { font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 2px; }
    .error-text { font-size: 0.75rem; color: #dc2626; margin-top: 4px; }
  `],
})
export class FacilityBookingDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FacilityBookingDialogComponent>);
  readonly data = inject<FacilityBookingDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      facility_name: ['', Validators.required],
      purpose: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      status: ['PENDING'],
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.booking) {
      this.form.patchValue({
        facility_name: this.data.booking.facility_name,
        purpose: this.data.booking.purpose,
        start_time: this.data.booking.start_time,
        end_time: this.data.booking.end_time,
        status: this.data.booking.status,
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

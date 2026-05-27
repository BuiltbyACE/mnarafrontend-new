import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { SchoolEvent } from '../../services/operations.service';

export interface EventDialogData {
  isEdit: boolean;
  event?: SchoolEvent;
}

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'New' }} Event</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label class="input-label">Title</label>
          <input formControlName="title" placeholder="e.g., Sports Day" />
          @if (form.get('title')?.hasError('required')) {
            <span class="error-text">Title is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Description</label>
          <textarea formControlName="description" rows="3" placeholder="Event details..."></textarea>
          @if (form.get('description')?.hasError('required')) {
            <span class="error-text">Description is required</span>
          }
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="input-label">Event Date</label>
            <input type="date" formControlName="event_date" />
            @if (form.get('event_date')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
          <div class="form-field">
            <label class="input-label">Location</label>
            <input formControlName="location" placeholder="e.g., Main Hall" />
            @if (form.get('location')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="input-label">Start Time</label>
            <input type="time" formControlName="start_time" />
            @if (form.get('start_time')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
          <div class="form-field">
            <label class="input-label">End Time</label>
            <input type="time" formControlName="end_time" />
            @if (form.get('end_time')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
        </div>

        <div class="form-field">
          <label class="input-label">Active</label>
          <select formControlName="is_active">
            <option [value]="true">Active</option>
            <option [value]="false">Cancelled</option>
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
export class EventDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EventDialogComponent>);
  readonly data = inject<EventDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      event_date: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      location: ['', Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.event) {
      this.form.patchValue({
        title: this.data.event.title,
        description: this.data.event.description,
        event_date: this.data.event.event_date,
        start_time: this.data.event.start_time,
        end_time: this.data.event.end_time,
        location: this.data.event.location,
        is_active: this.data.event.is_active,
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

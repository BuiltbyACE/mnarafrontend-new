import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { IncidentLog } from '../../services/operations.service';

export interface IncidentDialogData {
  isEdit: boolean;
  incident?: IncidentLog;
}

@Component({
  selector: 'app-incident-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'Report' }} Incident</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-row">
          <div class="form-field">
            <label class="input-label">Title</label>
            <input formControlName="title" placeholder="e.g., Power Outage" />
            @if (form.get('title')?.hasError('required')) {
              <span class="error-text">Title is required</span>
            }
          </div>
          <div class="form-field">
            <label class="input-label">Incident Date</label>
            <input type="date" formControlName="incident_date" />
            @if (form.get('incident_date')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
        </div>

        <div class="form-field">
          <label class="input-label">Description</label>
          <textarea formControlName="description" rows="3" placeholder="Describe what happened..."></textarea>
          @if (form.get('description')?.hasError('required')) {
            <span class="error-text">Description is required</span>
          }
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="input-label">Severity</label>
            <select formControlName="severity">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            @if (form.get('severity')?.hasError('required')) {
              <span class="error-text">Required</span>
            }
          </div>
          <div class="form-field">
            <label class="input-label">Status</label>
            <select formControlName="status">
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="input-label">Action Taken</label>
          <textarea formControlName="action_taken" rows="3" placeholder="Steps taken to address..."></textarea>
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
export class IncidentDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<IncidentDialogComponent>);
  readonly data = inject<IncidentDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      incident_date: ['', Validators.required],
      severity: ['LOW', Validators.required],
      status: ['OPEN'],
      action_taken: [''],
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.incident) {
      this.form.patchValue({
        title: this.data.incident.title,
        description: this.data.incident.description,
        incident_date: this.data.incident.incident_date,
        severity: this.data.incident.severity,
        status: this.data.incident.status,
        action_taken: this.data.incident.action_taken,
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

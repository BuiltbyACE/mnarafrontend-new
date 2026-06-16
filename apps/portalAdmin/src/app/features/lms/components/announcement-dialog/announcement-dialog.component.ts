import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Announcement } from '../../services/operations.service';

export interface AnnouncementDialogData {
  isEdit: boolean;
  announcement?: Announcement;
}

@Component({
  selector: 'app-announcement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit' : 'New' }} Announcement</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label class="input-label">Title</label>
          <input formControlName="title" placeholder="e.g., End of Year Ceremony" />
          @if (form.get('title')?.hasError('required')) {
            <span class="error-text">Title is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Message</label>
          <textarea formControlName="content" rows="4" placeholder="Write announcement..."></textarea>
          @if (form.get('content')?.hasError('required')) {
            <span class="error-text">Message is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Audience</label>
          <select formControlName="audience">
            <option value="">Select Audience</option>
            <option value="ALL">Everyone</option>
            <option value="STUDENTS">Students Only</option>
            <option value="STAFF">Staff Only</option>
            <option value="PARENTS">Parents Only</option>
          </select>
          @if (form.get('audience')?.hasError('required')) {
            <span class="error-text">Audience is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Active</label>
          <select formControlName="is_active">
            <option [value]="true">Active</option>
            <option [value]="false">Inactive</option>
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
export class AnnouncementDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AnnouncementDialogComponent>);
  readonly data = inject<AnnouncementDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      audience: ['', Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.announcement) {
      this.form.patchValue({
        title: this.data.announcement.title,
        content: this.data.announcement.content,
        audience: this.data.announcement.audience,
        is_active: this.data.announcement.is_active,
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

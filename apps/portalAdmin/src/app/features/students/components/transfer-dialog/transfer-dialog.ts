import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Transfer Student</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-field">
          <label class="input-label">Transfer Date *</label>
          <input type="date" formControlName="transfer_date" />
          @if (form.get('transfer_date')?.hasError('required')) {
            <span class="error-text">Transfer date is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Destination School *</label>
          <input formControlName="destination_school" placeholder="e.g., Mombasa Academy" />
          @if (form.get('destination_school')?.hasError('required')) {
            <span class="error-text">Destination school is required</span>
          }
        </div>

        <div class="form-field">
          <label class="input-label">Transfer Reason</label>
          <textarea formControlName="transfer_reason" placeholder="Why is the student transferring?" rows="3"></textarea>
        </div>

        <div class="form-field">
          <label class="input-label">Notes</label>
          <textarea formControlName="notes" placeholder="Additional notes (e.g. transfer certificate requested)" rows="2"></textarea>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="warn" [disabled]="form.invalid" (click)="onSubmit()">
        Transfer Student
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; min-width: 420px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; width: 100%; }
    .form-field input, .form-field textarea, .form-field select {
      width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; color: #1f2937; background: #fff; transition: border-color 0.15s;
      box-sizing: border-box; font-family: inherit;
    }
    .form-field input:focus, .form-field textarea:focus, .form-field select:focus {
      outline: none; border-color: #dc2626; box-shadow: 0 0 0 2px rgba(220,38,38,0.2);
    }
    .input-label { font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 2px; }
    .error-text { font-size: 0.75rem; color: #dc2626; margin-top: 4px; }
  `],
})
export class TransferDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TransferDialogComponent>);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      transfer_date: ['', Validators.required],
      destination_school: ['', Validators.required],
      transfer_reason: [''],
      notes: [''],
    });
    const today = new Date().toISOString().split('T')[0];
    this.form.patchValue({ transfer_date: today });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const value = this.form.value;
      const payload: Record<string, string> = { transfer_date: value.transfer_date, destination_school: value.destination_school };
      if (value['transfer_reason']?.trim()) payload['transfer_reason'] = value['transfer_reason'].trim();
      if (value['notes']?.trim()) payload['notes'] = value['notes'].trim();
      this.dialogRef.close(payload);
    }
  }
}

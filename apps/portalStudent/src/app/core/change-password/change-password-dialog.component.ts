import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getApiUrl } from '@sms/core/config';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-change-password-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Change Password</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Current Password</mat-label>
          <input
            matInput
            [type]="hideCurrent ? 'password' : 'text'"
            formControlName="currentPassword"
            autocomplete="current-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hideCurrent = !hideCurrent"
            [attr.aria-label]="'Toggle visibility'"
          >
            <mat-icon>{{ hideCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.get('currentPassword')?.hasError('required')) {
            <mat-error>Current password is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Password</mat-label>
          <input
            matInput
            [type]="hideNew ? 'password' : 'text'"
            formControlName="newPassword"
            autocomplete="new-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hideNew = !hideNew"
            [attr.aria-label]="'Toggle visibility'"
          >
            <mat-icon>{{ hideNew ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.get('newPassword')?.hasError('required')) {
            <mat-error>New password is required</mat-error>
          }
          @if (form.get('newPassword')?.hasError('minlength')) {
            <mat-error>Minimum 8 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm New Password</mat-label>
          <input
            matInput
            [type]="hideConfirm ? 'password' : 'text'"
            formControlName="confirmPassword"
            autocomplete="new-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hideConfirm = !hideConfirm"
            [attr.aria-label]="'Toggle visibility'"
          >
            <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.get('confirmPassword')?.hasError('required')) {
            <mat-error>Please confirm your new password</mat-error>
          }
          @if (form.hasError('mismatch')) {
            <mat-error>Passwords do not match</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="form.invalid || isSubmitting"
        (click)="submit()"
      >
        {{ isSubmitting ? 'Changing...' : 'Change Password' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
    .dialog-form { display: flex; flex-direction: column; gap: 16px; min-width: 380px; padding-top: 8px; }
    .full-width { width: 100%; }
  `,
  ],
})
export class ChangePasswordDialogComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);
  readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);

  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;
  isSubmitting = false;

  readonly form: FormGroup = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPw = control.get('newPassword')?.value;
    const confirmPw = control.get('confirmPassword')?.value;
    return newPw && confirmPw && newPw !== confirmPw ? { mismatch: true } : null;
  }

  submit(): void {
    if (this.form.invalid) return;
    this.isSubmitting = true;

    const { currentPassword, newPassword, confirmPassword } = this.form.value;

    this.http.post(getApiUrl('/accounts/auth/change-password/'), {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || err.error?.detail || 'Failed to change password';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      },
    });
  }
}

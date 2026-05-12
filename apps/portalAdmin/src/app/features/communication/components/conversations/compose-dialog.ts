import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommunicationService, ChatUser, ConversationThread } from '../../services/communication.service';

@Component({
  selector: 'app-compose-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="compose-dialog">
      <div class="dialog-header">
        <h2>New Conversation</h2>
        <button mat-icon-button (click)="close()" aria-label="Close"><mat-icon>close</mat-icon></button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="compose-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Recipients</mat-label>
          <mat-select formControlName="participants" multiple>
            @for (user of availableUsers(); track user.id) {
              <mat-option [value]="user.id">
                {{ user.name }}
                <span class="user-role">— {{ user.role }}</span>
              </mat-option>
            }
          </mat-select>
          @if (form.get('participants')?.hasError('required') && form.get('participants')?.touched) {
            <mat-error>Select at least one recipient</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Subject (optional)</mat-label>
          <input matInput formControlName="subject" placeholder="e.g. Staff Meeting Reminder">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Message</mat-label>
          <textarea matInput formControlName="message" rows="4" placeholder="Type your message..."></textarea>
          @if (form.get('message')?.hasError('required') && form.get('message')?.touched) {
            <mat-error>Message is required</mat-error>
          }
        </mat-form-field>

        @if (error()) {
          <div class="error-msg">
            <mat-icon>error</mat-icon>
            <span>{{ error() }}</span>
          </div>
        }

        <div class="dialog-actions">
          <button mat-stroked-button type="button" (click)="close()" [disabled]="isSubmitting()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || isSubmitting()">
            @if (isSubmitting()) {
              <mat-spinner diameter="18"></mat-spinner>
              Sending...
            } @else {
              <mat-icon>send</mat-icon>
              Send
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .compose-dialog { width: 520px; max-width: 100%; }
    .dialog-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 0;
    }
    .dialog-header h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #111827; }
    .compose-form { display: flex; flex-direction: column; gap: 16px; padding: 20px 24px 24px; }
    .full-width { width: 100%; }
    .user-role { color: #9ca3af; font-size: 0.8rem; }
    .error-msg {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; background: #fee2e2; border-radius: 8px;
      color: #dc2626; font-size: 0.85rem;
    }
    .error-msg mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 4px; }
  `],
})
export class ComposeDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ComposeDialogComponent>);
  private service = inject(CommunicationService);

  readonly availableUsers = signal<ChatUser[]>([]);
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    participants: [[], Validators.required],
    subject: [''],
    message: ['', Validators.required],
  });

  constructor() {
    this.service.getAvailableUsers().subscribe({
      next: (users) => this.availableUsers.set(users),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);
    this.error.set(null);

    const { participants, subject, message } = this.form.value;
    this.service.startNewConversation(subject || '', participants, message).subscribe({
      next: (thread) => {
        this.dialogRef.close({ success: true, threadId: thread.id });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err.message || 'Failed to create conversation');
      },
    });
  }

  close(): void {
    this.dialogRef.close({ success: false });
  }
}

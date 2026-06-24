import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { KeyStage } from '../../services/academics.service';

export interface KeyStageDialogData {
  isEdit: boolean;
  keyStage?: KeyStage;
}

@Component({
  selector: 'app-key-stage-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="ks-dialog">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="dlg-header">
        <div class="dlg-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="dlg-header-text">
          <h2>{{ data.isEdit ? 'Edit Key Stage' : 'New Key Stage' }}</h2>
          <p>{{ data.isEdit ? 'Update the details of this key stage' : 'Define a new academic key stage for your school' }}</p>
        </div>
        <button class="dlg-close" type="button" (click)="onCancel()" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- ── Form Body ────────────────────────────────────────────────────── -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dlg-body" autocomplete="off">

        <!-- Section 1: Stage Identity -->
        <div class="form-section">
          <div class="section-label">
            <span class="sl-rule"></span>
            <span class="sl-text">Stage Identity</span>
          </div>
          <div class="field-row two-col">

            <div class="form-field" [class.field--error]="isInvalid('name')">
              <label class="field-label" for="ks-name">
                Name
                <span class="required-mark">*</span>
              </label>
              <input
                id="ks-name"
                class="field-input"
                formControlName="name"
                placeholder="e.g. Key Stage 3"
                type="text"
                autocomplete="off"
              />
              @if (isInvalid('name')) {
                <span class="field-error-msg">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/></svg>
                  Stage name is required
                </span>
              }
            </div>

            <div class="form-field">
              <label class="field-label" for="ks-code">
                Code
                <span class="field-label-hint">Short identifier</span>
              </label>
              <input
                id="ks-code"
                class="field-input field-input--mono"
                formControlName="code"
                placeholder="e.g. KS3"
                type="text"
                autocomplete="off"
                (blur)="uppercaseCode()"
              />
            </div>

          </div>
        </div>

        <!-- Section 2: About -->
        <div class="form-section">
          <div class="section-label">
            <span class="sl-rule"></span>
            <span class="sl-text">About</span>
          </div>

          <div class="form-field">
            <label class="field-label" for="ks-desc">
              Description
              <span class="field-label-hint">Optional · up to 300 characters</span>
            </label>
            <textarea
              id="ks-desc"
              class="field-textarea"
              formControlName="description"
              placeholder="Describe the academic focus, goals, and typical age range for this key stage…"
              rows="3"
              maxlength="300"
            ></textarea>
            <div class="field-footer-row">
              <span class="field-hint">Helps staff understand scope when assigning year levels</span>
              <span class="char-count" [class.char-count--near]="descLength > 240" [class.char-count--max]="descLength >= 290">
                {{ descLength }}/300
              </span>
            </div>
          </div>
        </div>

        <!-- Section 3: Settings -->
        <div class="form-section">
          <div class="section-label">
            <span class="sl-rule"></span>
            <span class="sl-text">Settings</span>
          </div>

          <div class="field-row two-col">

            <div class="form-field">
              <label class="field-label" for="ks-order">
                Display Order
                <span class="field-label-hint">Sort position</span>
              </label>
              <div class="input-with-adornment">
                <span class="input-adornment">#</span>
                <input
                  id="ks-order"
                  class="field-input field-input--adorned"
                  formControlName="order"
                  type="number"
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>

            <div class="form-field">
              <label class="field-label" for="ks-level">
                Level
                <span class="field-label-hint">e.g. Primary, Secondary</span>
              </label>
              <input
                id="ks-level"
                class="field-input"
                formControlName="level"
                placeholder="e.g. Secondary"
                type="text"
              />
            </div>

          </div>

          <!-- Status Toggle -->
          <div class="form-field">
            <label class="field-label">Status</label>
            <div class="status-toggle-row">
              <button
                type="button"
                class="status-option"
                [class.status-option--active]="form.get('is_active')?.value !== false"
                (click)="form.patchValue({ is_active: true })">
                <span class="so-dot so-dot--green"></span>
                <div class="so-text">
                  <span class="so-title">Active</span>
                  <span class="so-sub">Visible and operational</span>
                </div>
                <span class="so-check">
                  @if (form.get('is_active')?.value !== false) {
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z"/></svg>
                  }
                </span>
              </button>

              <button
                type="button"
                class="status-option"
                [class.status-option--inactive]="form.get('is_active')?.value === false"
                (click)="form.patchValue({ is_active: false })">
                <span class="so-dot so-dot--gray"></span>
                <div class="so-text">
                  <span class="so-title">Inactive</span>
                  <span class="so-sub">Hidden from users</span>
                </div>
                <span class="so-check">
                  @if (form.get('is_active')?.value === false) {
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z"/></svg>
                  }
                </span>
              </button>
            </div>
          </div>

        </div>

      </form>

      <!-- ── Footer ───────────────────────────────────────────────────────── -->
      <div class="dlg-footer">
        <button class="dlg-btn dlg-btn--ghost" type="button" (click)="onCancel()">
          Cancel
        </button>
        <button
          class="dlg-btn dlg-btn--primary"
          type="button"
          (click)="onSubmit()"
          [disabled]="form.invalid || submitting()">
          @if (submitting()) {
            <span class="dlg-spinner"></span>
            Saving…
          } @else {
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M13.5 4.5l-7 7L3 8"/>
            </svg>
            {{ data.isEdit ? 'Save Changes' : 'Create Key Stage' }}
          }
        </button>
      </div>

    </div>
  `,
  styles: [`
    /* ── Root ────────────────────────────────────────────────────────────── */
    .ks-dialog {
      display: flex;
      flex-direction: column;
      width: 100%;
      background: #fff;
      font-family: 'Inter', system-ui, sans-serif;
      max-height: 88vh;
      overflow: hidden;
    }

    /* ── Header ──────────────────────────────────────────────────────────── */
    .dlg-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 24px 24px 20px;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(to bottom, #f8fbff, #fff);
      flex-shrink: 0;
    }

    .dlg-header-icon {
      width: 46px;
      height: 46px;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.30);
      svg {
        width: 22px;
        height: 22px;
        stroke: #fff;
      }
    }

    .dlg-header-text {
      flex: 1;
      min-width: 0;

      h2 {
        font-size: 17px;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.02em;
        margin: 0 0 3px;
      }

      p {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
      }
    }

    .dlg-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.14s ease;
      margin-top: -2px;

      svg {
        width: 14px;
        height: 14px;
        stroke: #6b7280;
      }

      &:hover {
        background: #fef2f2;
        border-color: #fecaca;
        svg { stroke: #ef4444; }
      }
    }

    /* ── Form Body ───────────────────────────────────────────────────────── */
    .dlg-body {
      flex: 1;
      overflow-y: auto;
      padding: 0 24px;
      scrollbar-width: thin;
      scrollbar-color: #e5e7eb transparent;
    }

    /* ── Form Sections ───────────────────────────────────────────────────── */
    .form-section {
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;

      & + .form-section {
        border-top: 1px solid #f3f4f6;
      }
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sl-rule {
      width: 3px;
      height: 16px;
      background: linear-gradient(to bottom, #2563eb, #3b82f6);
      border-radius: 99px;
      flex-shrink: 0;
    }

    .sl-text {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2563eb;
    }

    /* ── Field Grid ──────────────────────────────────────────────────────── */
    .field-row {
      display: flex;
      gap: 14px;

      &.two-col > * { flex: 1; min-width: 0; }
    }

    /* ── Form Field ──────────────────────────────────────────────────────── */
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      line-height: 1;
    }

    .required-mark {
      color: #ef4444;
      font-size: 14px;
      line-height: 1;
    }

    .field-label-hint {
      font-weight: 400;
      color: #9ca3af;
      font-size: 11.5px;
      margin-left: 2px;
    }

    /* ── Inputs ──────────────────────────────────────────────────────────── */
    .field-input {
      width: 100%;
      padding: 10px 13px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      color: #111827;
      background: #fafafa;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      line-height: 1.5;

      &::placeholder { color: #c4c9d4; }

      &:focus {
        outline: none;
        border-color: #2563eb;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      &--mono {
        font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
        font-size: 13.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      &--adorned {
        padding-left: 36px;
      }
    }

    .field--error .field-input {
      border-color: #ef4444;
      background: #fffafa;
      &:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12); }
    }

    .field-error-msg {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #dc2626;
      font-weight: 500;
      svg { width: 13px; height: 13px; fill: #dc2626; flex-shrink: 0; }
    }

    /* ── Input with adornment ────────────────────────────────────────────── */
    .input-with-adornment {
      position: relative;
    }

    .input-adornment {
      position: absolute;
      left: 13px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      font-weight: 600;
      color: #9ca3af;
      pointer-events: none;
      user-select: none;
    }

    /* ── Textarea ────────────────────────────────────────────────────────── */
    .field-textarea {
      width: 100%;
      padding: 10px 13px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      color: #111827;
      background: #fafafa;
      box-sizing: border-box;
      resize: vertical;
      min-height: 80px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      line-height: 1.6;

      &::placeholder { color: #c4c9d4; }

      &:focus {
        outline: none;
        border-color: #2563eb;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
    }

    .field-footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .field-hint {
      font-size: 11.5px;
      color: #9ca3af;
      line-height: 1.4;
    }

    .char-count {
      font-size: 11.5px;
      color: #9ca3af;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      flex-shrink: 0;
      font-weight: 500;

      &--near { color: #d97706; }
      &--max  { color: #ef4444; }
    }

    /* ── Status Toggle ───────────────────────────────────────────────────── */
    .status-toggle-row {
      display: flex;
      gap: 10px;
    }

    .status-option {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      background: #fafafa;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      font-family: inherit;

      &:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      &--active {
        border-color: #2563eb;
        background: #eff6ff;
        box-shadow: 0 0 0 1px #2563eb;
      }

      &--inactive {
        border-color: #6b7280;
        background: #f9fafb;
        box-shadow: 0 0 0 1px #6b7280;
      }
    }

    .so-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex-shrink: 0;

      &--green {
        background: #22c55e;
        box-shadow: 0 0 0 2.5px rgba(34, 197, 94, 0.2);
      }

      &--gray { background: #9ca3af; }
    }

    .so-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .so-title {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }

    .so-sub {
      font-size: 11.5px;
      color: #9ca3af;
    }

    .so-check {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.15s ease;

      svg {
        width: 10px;
        height: 10px;
        stroke: none;
        fill: #fff;
      }
    }

    .status-option--active .so-check,
    .status-option--inactive .so-check {
      opacity: 1;
    }

    .status-option--inactive .so-check {
      background: #6b7280;
    }

    /* ── Footer ──────────────────────────────────────────────────────────── */
    .dlg-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px 20px;
      border-top: 1px solid #f1f5f9;
      background: #fafafa;
      flex-shrink: 0;
    }

    .dlg-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.18s ease;
      line-height: 1;
      svg { width: 14px; height: 14px; flex-shrink: 0; }

      &--ghost {
        background: #fff;
        color: #374151;
        border: 1.5px solid #e5e7eb;
        &:hover { background: #f9fafb; border-color: #d1d5db; }
      }

      &--primary {
        background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.32);

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.42);
        }

        &:active:not(:disabled) { transform: translateY(0); }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      }
    }

    /* ── Spinner ─────────────────────────────────────────────────────────── */
    .dlg-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class KeyStageDialogComponent implements OnInit {
  private fb        = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<KeyStageDialogComponent>);
  data              = inject<KeyStageDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;
  submitting = signal(false);

  get descLength(): number {
    return (this.form.get('description')?.value ?? '').length;
  }

  constructor() {
    this.form = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      code:        [''],
      description: [''],
      order:       [null],
      level:       [''],
      is_active:   [true],
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.keyStage) {
      const ks = this.data.keyStage;
      this.form.patchValue({
        name:        ks.name,
        code:        ks.code,
        description: ks.description,
        order:       ks.order ?? null,
        level:       ks.level ?? '',
        is_active:   ks.is_active !== false,
      });
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  uppercaseCode(): void {
    const v = this.form.get('code')?.value;
    if (v) this.form.patchValue({ code: v.toUpperCase() }, { emitEvent: false });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const value = { ...this.form.value };
    if (!value.order) delete value.order;
    if (!value.level) delete value.level;
    this.dialogRef.close(value);
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicsService, YearLevel } from '../../services/academics.service';

export interface YearLevelDialogData {
  isEdit: boolean;
  yearLevel?: YearLevel;
}

@Component({
  selector: 'app-year-level-dialog',
  standalone: true,
  host: { class: 'yldlg-host' },
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Header -->
    <div class="dlg-header">
      <div class="dlg-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" class="dlg-icon">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      </div>
      <div class="dlg-title-block">
        <h2 class="dlg-title">{{ data.isEdit ? 'Edit Year Level' : 'Add Year Level' }}</h2>
        <p class="dlg-subtitle">{{ data.isEdit ? 'Update year level details' : 'Set up a new year level for your institution' }}</p>
      </div>
      <button class="dlg-close" type="button" (click)="onCancel()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Body -->
    <form [formGroup]="form" class="dlg-body" (ngSubmit)="onSubmit()">

      <!-- Section 1: Identity -->
      <div class="sl-row">
        <span class="sl-rule"></span>
        <span class="sl-text">Year Identity</span>
      </div>

      <div class="field-group">

        <!-- Name -->
        <div class="field">
          <label class="field-label" for="yl-name">
            Year Level Name <span class="req">*</span>
          </label>
          <div class="input-wrap" [class.input-error]="isInvalid('name')">
            <span class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
              </svg>
            </span>
            <input
              id="yl-name"
              formControlName="name"
              type="text"
              placeholder="e.g., Year 7"
              autocomplete="off"
            />
          </div>
          @if (isInvalid('name')) {
            <span class="field-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Year level name is required
            </span>
          }
        </div>

        <!-- Order -->
        <div class="field">
          <label class="field-label" for="yl-order">
            Display Order <span class="req">*</span>
          </label>
          <div class="input-wrap" [class.input-error]="isInvalid('order')">
            <span class="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </span>
            <input
              id="yl-order"
              formControlName="order"
              type="number"
              placeholder="e.g., 7"
              min="1"
              max="99"
            />
          </div>
          @if (isInvalid('order')) {
            <span class="field-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Display order is required
            </span>
          }
          <span class="field-hint">Lower numbers appear first in the year levels list</span>
        </div>

      </div>

      <!-- Section 2: Classification -->
      <div class="sl-row" style="margin-top: 6px;">
        <span class="sl-rule"></span>
        <span class="sl-text">Classification</span>
      </div>

      <div class="field-group">

        <!-- Key Stage -->
        <div class="field">
          <label class="field-label" for="yl-ks">
            Key Stage <span class="req">*</span>
          </label>
          <div class="select-wrap" [class.select-error]="isInvalid('key_stage')">
            <select id="yl-ks" formControlName="key_stage">
              <option value="">
                {{ service.isLoading() ? 'Loading key stages…' : 'Select a Key Stage' }}
              </option>
              @for (ks of service.keyStages(); track ks.id) {
                <option [ngValue]="ks.id">{{ ks.name }}</option>
              }
            </select>
            <span class="select-chevron">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </div>
          @if (isInvalid('key_stage')) {
            <span class="field-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Key Stage is required
            </span>
          }
        </div>

      </div>

    </form>

    <!-- Footer -->
    <div class="dlg-footer">
      <button class="btn-cancel" type="button" (click)="onCancel()">Cancel</button>
      <button
        class="btn-primary"
        type="button"
        [disabled]="form.invalid || submitting()"
        (click)="onSubmit()"
      >
        @if (submitting()) {
          <span class="btn-spinner"></span>
          <span>{{ data.isEdit ? 'Updating…' : 'Creating…' }}</span>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
            @if (data.isEdit) {
              <path d="M20 6L9 17l-5-5"/>
            } @else {
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            }
          </svg>
          <span>{{ data.isEdit ? 'Update Year Level' : 'Add Year Level' }}</span>
        }
      </button>
    </div>
  `,
  styles: [`
    @keyframes dlgSlideIn {
      from { opacity: 0; transform: translateY(-14px) scale(0.975); }
      to   { opacity: 1; transform: translateY(0)     scale(1);     }
    }

    :host.yldlg-host {
      display: flex;
      flex-direction: column;
      width: 480px;
      max-width: 96vw;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.13), 0 8px 24px rgba(0,0,0,0.07);
      animation: dlgSlideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* ── Header ── */
    .dlg-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 22px 22px 18px;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
    }

    .dlg-icon-wrap {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(37,99,235,0.35);
    }

    .dlg-icon {
      width: 22px;
      height: 22px;
      color: #ffffff;
    }

    .dlg-title-block { flex: 1; }

    .dlg-title {
      margin: 0 0 2px;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .dlg-subtitle {
      margin: 0;
      font-size: 12.5px;
      color: #64748b;
    }

    .dlg-close {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      &:hover { background: #f1f5f9; color: #475569; }
    }

    /* ── Body ── */
    .dlg-body {
      padding: 20px 22px 4px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* Section rule */
    .sl-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sl-rule {
      flex-shrink: 0;
      width: 3px;
      height: 14px;
      border-radius: 2px;
      background: linear-gradient(180deg, #2563eb 0%, #7c3aed 100%);
    }

    .sl-text {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    /* Field group */
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .req { color: #ef4444; margin-left: 2px; }

    /* Input */
    .input-wrap {
      display: flex;
      align-items: center;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      overflow: hidden;
      transition: border-color 0.18s, box-shadow 0.18s;

      &:focus-within {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
      }

      &.input-error {
        border-color: #ef4444;
        &:focus-within { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
      }
    }

    .input-icon {
      flex-shrink: 0;
      width: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      border-right: 1.5px solid #f1f5f9;
    }

    .input-wrap input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 10px 12px;
      font-size: 14px;
      color: #0f172a;
      font-family: inherit;

      &::placeholder { color: #cbd5e1; }

      &[type="number"] {
        -moz-appearance: textfield;
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button { -webkit-appearance: none; }
      }
    }

    /* Select */
    .select-wrap {
      position: relative;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
      overflow: hidden;
      transition: border-color 0.18s, box-shadow 0.18s;

      &:focus-within {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        .select-chevron { transform: translateY(-50%) rotate(180deg); }
      }

      &.select-error {
        border-color: #ef4444;
        &:focus-within { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
      }
    }

    .select-wrap select {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      appearance: none;
      -webkit-appearance: none;
      padding: 10px 40px 10px 12px;
      font-size: 14px;
      color: #0f172a;
      font-family: inherit;
      cursor: pointer;

      option[value=""] { color: #94a3b8; }
    }

    .select-chevron {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
      transition: transform 0.2s ease;
    }

    /* Validation */
    .field-error {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #ef4444;
      font-weight: 500;
    }

    .field-hint {
      font-size: 11.5px;
      color: #94a3b8;
    }

    /* ── Footer ── */
    .dlg-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 22px 20px;
      border-top: 1px solid #f1f5f9;
      margin-top: 18px;
    }

    .btn-cancel {
      padding: 9px 18px;
      border-radius: 9px;
      border: 1.5px solid #e2e8f0;
      background: transparent;
      font-size: 13.5px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
      &:hover { border-color: #cbd5e1; background: #f8fafc; color: #374151; }
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 20px;
      border-radius: 9px;
      border: none;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      font-size: 13.5px;
      font-weight: 600;
      color: #ffffff;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s, box-shadow 0.15s, transform 0.12s;
      box-shadow: 0 3px 10px rgba(37,99,235,0.3);

      &:hover:not(:disabled) {
        box-shadow: 0 5px 16px rgba(37,99,235,0.4);
        transform: translateY(-1px);
      }

      &:active:not(:disabled) { transform: translateY(0); }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        box-shadow: none;
      }
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class YearLevelDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<YearLevelDialogComponent>);
  protected service = inject(AcademicsService);
  data = inject<YearLevelDialogData>(MAT_DIALOG_DATA);

  submitting = signal(false);

  form: FormGroup = this.fb.group({
    name:      ['', [Validators.required, Validators.minLength(2)]],
    order:     [1,  Validators.required],
    key_stage: ['', Validators.required],
  });

  ngOnInit(): void {
    this.service.getKeyStages().subscribe();

    if (this.data.isEdit && this.data.yearLevel) {
      const yl = this.data.yearLevel;
      const ksId = typeof yl.key_stage === 'object' && yl.key_stage !== null
        ? yl.key_stage.id
        : yl.key_stage;
      this.form.patchValue({ name: yl.name, order: yl.order, key_stage: ksId });
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.dialogRef.close(this.form.value);
  }
}

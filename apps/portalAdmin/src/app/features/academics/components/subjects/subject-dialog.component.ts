import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicsService, Subject } from '../../services/academics.service';

export interface SubjectDialogData {
  isEdit: boolean;
  subject?: Subject;
}

@Component({
  selector: 'app-subject-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  host: { class: 'sdlg-host' },
  template: `
<div class="sdlg">

  <!-- ── Header ────────────────────────────────────────────────────────── -->
  <div class="dlg-header">
    <div class="dlg-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <circle cx="7" cy="7" r="1.2" fill="white" stroke="none"/>
      </svg>
    </div>
    <div class="dlg-head-text">
      <h2>{{ data.isEdit ? 'Edit Subject' : 'New Subject' }}</h2>
      <p>{{ data.isEdit ? 'Update subject details and classification' : 'Add a new subject to the curriculum' }}</p>
    </div>
    <button class="dlg-close" type="button" (click)="onCancel()" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  <!-- ── Form Body ─────────────────────────────────────────────────────── -->
  <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dlg-body" autocomplete="off">

    <!-- Section 1: Identity -->
    <div class="form-section">
      <div class="section-label">
        <span class="sl-rule"></span>
        <span class="sl-text">Subject Identity</span>
      </div>

      <div class="form-field" [class.field--error]="isInvalid('name')">
        <label class="field-label" for="sd-name">
          Subject Name <span class="req">*</span>
        </label>
        <input id="sd-name" class="field-input" formControlName="name"
               placeholder="e.g. Mathematics, Biology…" type="text" />
        @if (isInvalid('name')) {
          <span class="field-err">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/></svg>
            {{ form.get('name')?.hasError('required') ? 'Name is required' : 'Minimum 2 characters' }}
          </span>
        }
      </div>

      <div class="form-field">
        <label class="field-label" for="sd-code">
          Subject Code
          <span class="field-hint">Short identifier e.g. MATH, BIO</span>
        </label>
        <div class="input-with-prefix">
          <span class="input-prefix">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><line x1="5" y1="7" x2="11" y2="7"/><line x1="5" y1="10" x2="8" y2="10"/></svg>
          </span>
          <input id="sd-code" class="field-input field-input--prefixed" formControlName="code"
                 placeholder="e.g. MATH" type="text" (blur)="uppercaseCode()"
                 style="font-family:'SF Mono','Cascadia Code','Consolas',monospace; letter-spacing:0.06em;" />
        </div>
      </div>
    </div>

    <!-- Section 2: Classification -->
    <div class="form-section">
      <div class="section-label">
        <span class="sl-rule"></span>
        <span class="sl-text">Classification</span>
      </div>

      <div class="form-field" [class.field--error]="isInvalid('department')">
        <label class="field-label" for="sd-dept">
          Department <span class="req">*</span>
        </label>
        @if (service.isLoading() && service.departments().length === 0) {
          <div class="field-loading">
            <span class="ld-spinner"></span>
            <span>Loading departments…</span>
          </div>
        } @else {
          <div class="select-wrap">
            <select id="sd-dept" class="field-select" formControlName="department">
              <option value="">Choose a department…</option>
              @for (d of service.departments(); track d.id) {
                <option [value]="d.id">{{ d.name }}</option>
              }
            </select>
            <svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        }
        @if (isInvalid('department')) {
          <span class="field-err">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/></svg>
            Please select a department
          </span>
        }
      </div>

      <!-- Status toggle cards -->
      <div class="form-field">
        <label class="field-label">Status</label>
        <div class="toggle-row">

          <button type="button" class="toggle-opt"
                  [class.toggle-opt--on]="form.get('is_active')?.value === true"
                  (click)="form.patchValue({ is_active: true })">
            <div class="toggle-icon toggle-icon--active">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            </div>
            <div class="toggle-body">
              <span class="toggle-title">Active</span>
              <span class="toggle-sub">Visible in curriculum</span>
            </div>
            <span class="toggle-check">
              @if (form.get('is_active')?.value === true) {
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z"/></svg>
              }
            </span>
          </button>

          <button type="button" class="toggle-opt"
                  [class.toggle-opt--off]="form.get('is_active')?.value === false"
                  (click)="form.patchValue({ is_active: false })">
            <div class="toggle-icon toggle-icon--inactive">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            </div>
            <div class="toggle-body">
              <span class="toggle-title">Inactive</span>
              <span class="toggle-sub">Hidden from curriculum</span>
            </div>
            <span class="toggle-check">
              @if (form.get('is_active')?.value === false) {
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z"/></svg>
              }
            </span>
          </button>

        </div>
      </div>
    </div>

  </form>

  <!-- ── Footer ────────────────────────────────────────────────────────── -->
  <div class="dlg-footer">
    <button class="dlg-btn dlg-btn--ghost" type="button" (click)="onCancel()">Cancel</button>
    <button class="dlg-btn dlg-btn--primary" type="button"
            (click)="onSubmit()" [disabled]="form.invalid || submitting()">
      @if (submitting()) {
        <span class="btn-spinner"></span>
        Saving…
      } @else {
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M13.5 4.5l-7 7L3 8"/>
        </svg>
        {{ data.isEdit ? 'Save Changes' : 'Create Subject' }}
      }
    </button>
  </div>

</div>
  `,
  styles: [`
    /* ── Entry animation ─────────────────────────────────────────────── */
    :host.sdlg-host {
      display: block;
      animation: dlgSlideIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes dlgSlideIn {
      from { opacity: 0; transform: translateY(-14px) scale(0.975); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── Root ────────────────────────────────────────────────────────── */
    .sdlg {
      display: flex; flex-direction: column;
      background: #fff;
      font-family: 'Inter', system-ui, sans-serif;
      max-height: 90vh; overflow: hidden;
      width: 100%;
    }

    /* ── Header ──────────────────────────────────────────────────────── */
    .dlg-header {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 22px 22px 18px;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(to bottom, #f8fbff, #fff);
      flex-shrink: 0;
    }

    .dlg-icon {
      width: 46px; height: 46px; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(37,99,235,0.30);
      svg { width: 22px; height: 22px; stroke: #fff; }
    }

    .dlg-head-text {
      flex: 1; min-width: 0;
      h2 { font-size: 17px; font-weight: 700; color: #111827; letter-spacing: -0.02em; margin: 0 0 3px; }
      p  { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.4; }
    }

    .dlg-close {
      width: 32px; height: 32px; border-radius: 8px;
      border: 1px solid #e5e7eb; background: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0; margin-top: -2px;
      transition: all 0.14s ease;
      svg { width: 14px; height: 14px; stroke: #6b7280; }
      &:hover { background: #fef2f2; border-color: #fecaca; svg { stroke: #ef4444; } }
    }

    /* ── Body ────────────────────────────────────────────────────────── */
    .dlg-body {
      flex: 1; overflow-y: auto; padding: 0 22px;
      scrollbar-width: thin; scrollbar-color: #e5e7eb transparent;
    }

    /* ── Sections ────────────────────────────────────────────────────── */
    .form-section {
      padding: 18px 0;
      display: flex; flex-direction: column; gap: 14px;
      & + .form-section { border-top: 1px solid #f3f4f6; }
    }

    .section-label { display: flex; align-items: center; gap: 10px; }

    .sl-rule {
      width: 3px; height: 16px;
      background: linear-gradient(to bottom, #2563eb, #3b82f6);
      border-radius: 99px; flex-shrink: 0;
    }

    .sl-text {
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em; color: #2563eb;
    }

    /* ── Form fields ─────────────────────────────────────────────────── */
    .form-field { display: flex; flex-direction: column; gap: 6px; }

    .field-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 13px; font-weight: 600; color: #374151; line-height: 1;
    }
    .req { color: #ef4444; font-size: 14px; }
    .field-hint { font-weight: 400; color: #9ca3af; font-size: 11.5px; margin-left: 2px; }

    .field-input {
      width: 100%; box-sizing: border-box;
      padding: 10px 13px;
      border: 1.5px solid #e5e7eb; border-radius: 10px;
      font-size: 14px; font-family: inherit; color: #111827; background: #fafafa;
      line-height: 1.5;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      &::placeholder { color: #c4c9d4; }
      &:focus { outline: none; border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
      &--prefixed { padding-left: 40px; }
    }

    .field--error .field-input {
      border-color: #ef4444; background: #fffafa;
      &:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); border-color: #ef4444; }
    }

    .field-err {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #dc2626; font-weight: 500;
      svg { width: 13px; height: 13px; fill: #dc2626; flex-shrink: 0; }
    }

    /* Input with left prefix icon */
    .input-with-prefix { position: relative; }

    .input-prefix {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      display: flex; align-items: center; pointer-events: none;
      svg { width: 15px; height: 15px; stroke: #9ca3af; }
    }

    /* Styled select */
    .select-wrap { position: relative; }

    .field-select {
      width: 100%; box-sizing: border-box;
      padding: 10px 40px 10px 13px;
      border: 1.5px solid #e5e7eb; border-radius: 10px;
      font-size: 14px; font-family: inherit; color: #111827; background: #fafafa;
      appearance: none; -webkit-appearance: none; cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      line-height: 1.5;
      &:focus { outline: none; border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
      option { color: #111827; background: #fff; }
      option:first-child { color: #9ca3af; }
    }

    .field--error .field-select { border-color: #ef4444; }

    .select-chevron {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      width: 16px; height: 16px; stroke: #9ca3af; pointer-events: none;
      transition: transform 0.2s ease, stroke 0.15s ease;
    }

    .field-select:focus ~ .select-chevron {
      stroke: #2563eb;
      transform: translateY(-50%) rotate(180deg);
    }

    /* Loading state for dept dropdown */
    .field-loading {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 13px;
      border: 1.5px solid #f1f5f9; border-radius: 10px;
      background: #fafafa; font-size: 13px; color: #9ca3af;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .ld-spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid #e5e7eb; border-top-color: #2563eb;
      animation: spin 0.7s linear infinite; flex-shrink: 0;
    }

    /* ── Status toggle cards ─────────────────────────────────────────── */
    .toggle-row { display: flex; gap: 10px; }

    .toggle-opt {
      flex: 1; display: flex; align-items: center; gap: 10px;
      padding: 11px 13px;
      border: 1.5px solid #e5e7eb; border-radius: 12px;
      background: #fafafa; cursor: pointer;
      font-family: inherit; text-align: left;
      transition: all 0.18s ease;
      &:hover { background: #f9fafb; border-color: #d1d5db; }

      &--on  {
        border-color: #16a34a; background: #f0fdf4;
        box-shadow: 0 0 0 1px #16a34a;
      }
      &--off {
        border-color: #d1d5db; background: #f8fafc;
        box-shadow: 0 0 0 1px #d1d5db;
      }
    }

    .toggle-icon {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      svg { width: 17px; height: 17px; }
      &--active   { background: #dcfce7; svg { fill: #16a34a; } }
      &--inactive { background: #f1f5f9; svg { fill: #94a3b8; } }
    }

    .toggle-body {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; gap: 1px;
    }
    .toggle-title { font-size: 13px; font-weight: 600; color: #111827; }
    .toggle-sub   { font-size: 11.5px; color: #9ca3af; }

    .toggle-check {
      width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .toggle-opt--on  .toggle-check { background: #16a34a; svg { fill: #fff; width: 10px; height: 10px; } }
    .toggle-opt--off .toggle-check { background: #94a3b8; svg { fill: #fff; width: 10px; height: 10px; } }

    /* ── Footer ──────────────────────────────────────────────────────── */
    .dlg-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: 10px;
      padding: 14px 22px 18px;
      border-top: 1px solid #f1f5f9; background: #fafafa; flex-shrink: 0;
    }

    .dlg-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 10px 20px; border-radius: 10px;
      font-size: 14px; font-weight: 600; font-family: inherit;
      cursor: pointer; border: none; transition: all 0.18s ease; line-height: 1;
      svg { width: 14px; height: 14px; flex-shrink: 0; }

      &--ghost {
        background: #fff; color: #374151; border: 1.5px solid #e5e7eb;
        &:hover { background: #f9fafb; border-color: #d1d5db; }
      }

      &--primary {
        background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(37,99,235,0.32);
        &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37,99,235,0.42); }
        &:active:not(:disabled) { transform: translateY(0); }
        &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
      }
    }

    .btn-spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
      animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
  `],
})
export class SubjectDialogComponent implements OnInit {
  private fb        = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SubjectDialogComponent>);
  protected service = inject(AcademicsService);
  data              = inject<SubjectDialogData>(MAT_DIALOG_DATA);

  submitting = signal(false);
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name:       ['', [Validators.required, Validators.minLength(2)]],
      code:       [''],
      department: ['', Validators.required],
      is_active:  [true],
    });
  }

  ngOnInit(): void {
    this.service.getDepartments().subscribe();

    if (this.data.isEdit && this.data.subject) {
      const s = this.data.subject;
      const deptId = typeof s.department === 'object' ? s.department.id : s.department;
      this.form.patchValue({
        name:       s.name,
        code:       s.code || '',
        department: deptId,
        is_active:  s.is_active,
      }, { emitEvent: false });
    }
  }

  uppercaseCode(): void {
    const ctrl = this.form.get('code');
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase().trim(), { emitEvent: false });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onCancel(): void { this.dialogRef.close(null); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const v = { ...this.form.value };
    if (!v.code) delete v.code;
    this.dialogRef.close(v);
  }
}

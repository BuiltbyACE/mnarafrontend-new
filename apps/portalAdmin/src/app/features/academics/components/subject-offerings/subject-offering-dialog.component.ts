import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getApiUrl } from '@sms/core/config';
import { AcademicsService, SubjectOffering } from '../../services/academics.service';

interface StaffProfileSelect { id: number; full_name: string; }

export interface SubjectOfferingDialogData {
  isEdit: boolean;
  offering?: SubjectOffering;
}

@Component({
  selector: 'app-subject-offering-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  host: { class: 'so-dialog-host' },
  template: `
    <div class="so-dlg">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="dlg-header">
        <div class="dlg-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            <line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>
          </svg>
        </div>
        <div class="dlg-head-text">
          <h2>{{ data.isEdit ? 'Edit Offering' : 'New Subject Offering' }}</h2>
          <p>{{ data.isEdit ? 'Update this subject offering record' : 'Assign a subject to a year level for this academic year' }}</p>
        </div>
        <button class="dlg-close" type="button" (click)="onCancel()" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- ── Form Body ────────────────────────────────────────────────────── -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dlg-body" autocomplete="off">

        <!-- Section 1: The Offering -->
        <div class="form-section">
          <div class="section-label"><span class="sl-rule"></span><span class="sl-text">The Offering</span></div>
          <div class="field-row two-col">

            <div class="form-field" [class.field--error]="isInvalid('subject')">
              <label class="field-label" for="so-subject">
                Subject <span class="required-mark">*</span>
              </label>
              <div class="select-wrap">
                <select id="so-subject" class="field-select" formControlName="subject">
                  <option value="">Choose a subject…</option>
                  @for (s of academicsService.subjects(); track s.id) {
                    <option [ngValue]="s.id">{{ s.name }}</option>
                  }
                </select>
                <svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              @if (isInvalid('subject')) {
                <span class="field-err-msg">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/></svg>
                  Subject is required
                </span>
              }
            </div>

            <div class="form-field" [class.field--error]="isInvalid('year_level')">
              <label class="field-label" for="so-yl">
                Year Level <span class="required-mark">*</span>
              </label>
              <div class="select-wrap">
                <select id="so-yl" class="field-select" formControlName="year_level">
                  <option value="">Choose a year level…</option>
                  @for (yl of academicsService.yearLevels(); track yl.id) {
                    <option [ngValue]="yl.id">{{ yl.name }}</option>
                  }
                </select>
                <svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              @if (isInvalid('year_level')) {
                <span class="field-err-msg">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/></svg>
                  Year level is required
                </span>
              }
            </div>

          </div>
        </div>

        <!-- Section 2: Schedule -->
        <div class="form-section">
          <div class="section-label"><span class="sl-rule"></span><span class="sl-text">Schedule</span></div>
          <div class="field-row two-col">

            <div class="form-field">
              <label class="field-label" for="so-ay">
                Academic Year
                <span class="field-label-hint">e.g. 2024/2025</span>
              </label>
              <input id="so-ay" class="field-input" formControlName="academic_year" placeholder="2024/2025" type="text" />
            </div>

            <div class="form-field">
              <label class="field-label" for="so-ch">
                Credit Hours
                <span class="field-label-hint">e.g. 4.0</span>
              </label>
              <div class="input-with-adornment">
                <input id="so-ch" class="field-input field-input--adorned-r" formControlName="credit_hours" placeholder="4.0" type="text" />
                <span class="input-adornment-r">hrs</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Section 3: Type -->
        <div class="form-section">
          <div class="section-label"><span class="sl-rule"></span><span class="sl-text">Offering Type</span></div>

          <div class="type-toggle-row">
            <button type="button" class="type-option"
                    [class.type-option--core]="form.get('is_compulsory')?.value === true"
                    (click)="form.patchValue({ is_compulsory: true })">
              <div class="type-option-icon type-icon--core">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              </div>
              <div class="type-option-body">
                <span class="type-option-title">Core</span>
                <span class="type-option-sub">Required for all students</span>
              </div>
              <span class="type-check">
                @if (form.get('is_compulsory')?.value === true) {
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z"/></svg>
                }
              </span>
            </button>

            <button type="button" class="type-option"
                    [class.type-option--elective]="form.get('is_compulsory')?.value === false"
                    (click)="form.patchValue({ is_compulsory: false })">
              <div class="type-option-icon type-icon--elective">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"/></svg>
              </div>
              <div class="type-option-body">
                <span class="type-option-title">Elective</span>
                <span class="type-option-sub">Optional, student-selected</span>
              </div>
              <span class="type-check">
                @if (form.get('is_compulsory')?.value === false) {
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6 10.586l6.293-6.293a1 1 0 011.414 0z"/></svg>
                }
              </span>
            </button>
          </div>
        </div>

        <!-- Section 4: Teacher & Advanced -->
        <div class="form-section">
          <div class="section-label"><span class="sl-rule"></span><span class="sl-text">Teacher &amp; Details</span></div>

          <div class="form-field">
            <label class="field-label" for="so-teacher">
              Assigned Teacher
              <span class="field-label-hint">Optional</span>
            </label>
            @if (loadingProfiles()) {
              <div class="teacher-loading">
                <mat-spinner diameter="16"></mat-spinner>
                <span>Loading staff list…</span>
              </div>
            } @else {
              <div class="select-wrap">
                <select id="so-teacher" class="field-select" formControlName="teacher">
                  <option [ngValue]="null">— Not assigned</option>
                  @for (p of staffProfiles(); track p.id) {
                    <option [ngValue]="p.id">{{ p.full_name }}</option>
                  }
                </select>
                <svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              @if (profilesError()) {
                <span class="field-hint-warn">{{ profilesError() }}</span>
              }
            }
          </div>

          <div class="form-field">
            <label class="field-label" for="so-sg">
              Selection Group
              <span class="field-label-hint">Optional — for grouped electives</span>
            </label>
            <input id="so-sg" class="field-input" formControlName="selection_group" placeholder="e.g. Sciences Group A" type="text" />
          </div>

        </div>

      </form>

      <!-- ── Footer ───────────────────────────────────────────────────────── -->
      <div class="dlg-footer">
        <button class="dlg-btn dlg-btn--ghost" type="button" (click)="onCancel()">Cancel</button>
        <button class="dlg-btn dlg-btn--primary" type="button" (click)="onSubmit()" [disabled]="form.invalid || submitting()">
          @if (submitting()) {
            <span class="dlg-spinner"></span>
            Saving…
          } @else {
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M13.5 4.5l-7 7L3 8"/>
            </svg>
            {{ data.isEdit ? 'Save Changes' : 'Create Offering' }}
          }
        </button>
      </div>

    </div>
  `,
  styles: [`
    :host.so-dialog-host {
      display: block;
      animation: dlgSlideIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes dlgSlideIn {
      from { opacity: 0; transform: translateY(-14px) scale(0.975); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }

    /* ── Root ────────────────────────────────────────────────────────────── */
    .so-dlg {
      display: flex;
      flex-direction: column;
      background: #fff;
      font-family: 'Inter', system-ui, sans-serif;
      max-height: 88vh;
      overflow: hidden;
      width: 100%;
    }

    /* ── Header ──────────────────────────────────────────────────────────── */
    .dlg-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 22px 22px 18px;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(to bottom, #f8fbff, #fff);
      flex-shrink: 0;
    }

    .dlg-icon {
      width: 46px;
      height: 46px;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.30);
      svg { width: 22px; height: 22px; stroke: #fff; }
    }

    .dlg-head-text {
      flex: 1;
      min-width: 0;
      h2 { font-size: 17px; font-weight: 700; color: #111827; letter-spacing: -0.02em; margin: 0 0 3px; }
      p  { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.4; }
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
      margin-top: -2px;
      transition: all 0.14s ease;
      svg { width: 14px; height: 14px; stroke: #6b7280; }
      &:hover { background: #fef2f2; border-color: #fecaca; svg { stroke: #ef4444; } }
    }

    /* ── Form Body ───────────────────────────────────────────────────────── */
    .dlg-body {
      flex: 1;
      overflow-y: auto;
      padding: 0 22px;
      scrollbar-width: thin;
      scrollbar-color: #e5e7eb transparent;
    }

    /* ── Sections ────────────────────────────────────────────────────────── */
    .form-section {
      padding: 18px 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
      & + .form-section { border-top: 1px solid #f3f4f6; }
    }

    .section-label { display: flex; align-items: center; gap: 10px; }

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

    /* ── Field Layout ────────────────────────────────────────────────────── */
    .field-row { display: flex; gap: 14px; }
    .two-col > * { flex: 1; min-width: 0; }

    /* ── Form Field ──────────────────────────────────────────────────────── */
    .form-field { display: flex; flex-direction: column; gap: 6px; }

    .field-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      line-height: 1;
    }

    .required-mark { color: #ef4444; font-size: 14px; }

    .field-label-hint { font-weight: 400; color: #9ca3af; font-size: 11.5px; margin-left: 2px; }

    /* ── Text Input ──────────────────────────────────────────────────────── */
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
      &--adorned-r { padding-right: 44px; }
    }

    .field--error .field-input {
      border-color: #ef4444;
      background: #fffafa;
      &:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
    }

    .field-err-msg {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #dc2626;
      font-weight: 500;
      svg { width: 13px; height: 13px; fill: #dc2626; flex-shrink: 0; }
    }

    /* ── Adornment ───────────────────────────────────────────────────────── */
    .input-with-adornment { position: relative; }

    .input-adornment-r {
      position: absolute;
      right: 13px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12.5px;
      font-weight: 600;
      color: #9ca3af;
      pointer-events: none;
    }

    /* ── Styled Select ───────────────────────────────────────────────────── */
    .select-wrap { position: relative; }

    .field-select {
      width: 100%;
      padding: 10px 40px 10px 13px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      color: #111827;
      background: #fafafa;
      box-sizing: border-box;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      line-height: 1.5;
      &:focus {
        outline: none;
        border-color: #2563eb;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
      option { color: #111827; background: #fff; }
      option:first-child { color: #9ca3af; }
    }

    .field--error .field-select {
      border-color: #ef4444;
      &:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
    }

    .select-chevron {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      stroke: #9ca3af;
      pointer-events: none;
      transition: transform 0.2s ease, stroke 0.15s ease;
    }

    .field-select:focus ~ .select-chevron {
      stroke: #2563eb;
      transform: translateY(-50%) rotate(180deg);
    }

    /* ── Teacher Loading ─────────────────────────────────────────────────── */
    .teacher-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 13px;
      border: 1.5px solid #f1f5f9;
      border-radius: 10px;
      background: #fafafa;
      font-size: 13px;
      color: #9ca3af;
    }

    .field-hint-warn {
      font-size: 12px;
      color: #d97706;
      font-style: italic;
    }

    /* ── Type Toggle ─────────────────────────────────────────────────────── */
    .type-toggle-row { display: flex; gap: 10px; }

    .type-option {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      background: #fafafa;
      cursor: pointer;
      transition: all 0.18s ease;
      font-family: inherit;
      text-align: left;

      &:hover { background: #f9fafb; border-color: #d1d5db; }

      &--core {
        border-color: #2563eb;
        background: #eff6ff;
        box-shadow: 0 0 0 1px #2563eb;
      }

      &--elective {
        border-color: #7c3aed;
        background: #f5f3ff;
        box-shadow: 0 0 0 1px #7c3aed;
      }
    }

    .type-option-icon {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      svg { width: 17px; height: 17px; }
    }

    .type-icon--core    { background: #eff6ff; svg { fill: #2563eb; } }
    .type-icon--elective { background: #f5f3ff; svg { fill: #7c3aed; } }

    .type-option-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .type-option-title { font-size: 13px; font-weight: 600; color: #111827; }
    .type-option-sub   { font-size: 11.5px; color: #9ca3af; }

    .type-check {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .type-option--core .type-check    { background: #2563eb; svg { fill: #fff; width: 10px; height: 10px; } }
    .type-option--elective .type-check { background: #7c3aed; svg { fill: #fff; width: 10px; height: 10px; } }

    /* ── Footer ──────────────────────────────────────────────────────────── */
    .dlg-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 22px 18px;
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
        &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37, 99, 235, 0.42); }
        &:active:not(:disabled) { transform: translateY(0); }
        &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
      }
    }

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
export class SubjectOfferingDialogComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private dialogRef    = inject(MatDialogRef<SubjectOfferingDialogComponent>);
  private http         = inject(HttpClient);
  readonly academicsService = inject(AcademicsService);
  data                 = inject<SubjectOfferingDialogData>(MAT_DIALOG_DATA);

  staffProfiles  = signal<StaffProfileSelect[]>([]);
  loadingProfiles = signal(false);
  profilesError   = signal('');
  submitting       = signal(false);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      subject:         ['', Validators.required],
      year_level:      ['', Validators.required],
      academic_year:   [''],
      credit_hours:    [''],
      teacher:         [null],
      is_compulsory:   [true],
      selection_group: [''],
    });
  }

  ngOnInit(): void {
    this.academicsService.getSubjects().subscribe();
    this.academicsService.getYearLevels().subscribe();

    if (this.data.isEdit && this.data.offering) {
      const o = this.data.offering;
      this.form.patchValue({
        subject:         o.subject,
        year_level:      o.year_level,
        academic_year:   o.academic_year ?? '',
        credit_hours:    o.credit_hours ?? '',
        teacher:         o.teacher,
        is_compulsory:   o.is_compulsory,
        selection_group: o.selection_group ?? '',
      }, { emitEvent: false });
      this.loadStaff(o.subject);
    } else {
      this.loadStaff();
    }

    this.form.get('subject')?.valueChanges.subscribe((id: number | '') => {
      this.loadStaff(id || undefined);
      this.form.patchValue({ teacher: null });
    });
  }

  private loadStaff(subjectId?: number): void {
    this.loadingProfiles.set(true);
    this.profilesError.set('');
    const url = getApiUrl('/staff/profiles/select/') + (subjectId ? `?subject_id=${subjectId}` : '');
    this.http.get<StaffProfileSelect[]>(url).subscribe({
      next: (p) => { this.staffProfiles.set(p); this.loadingProfiles.set(false); },
      error: (err) => {
        this.staffProfiles.set([]);
        this.profilesError.set(err.status === 404 ? 'Staff endpoint unavailable' : 'Could not load staff list');
        this.loadingProfiles.set(false);
      },
    });
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
    if (!v.selection_group) v.selection_group = null;
    if (!v.academic_year)   delete v.academic_year;
    if (!v.credit_hours)    delete v.credit_hours;
    this.dialogRef.close(v);
  }
}

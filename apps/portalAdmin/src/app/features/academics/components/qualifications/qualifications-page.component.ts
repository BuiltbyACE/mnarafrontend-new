import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AcademicsService, Qualification, TeacherSelect } from '../../services/academics.service';

@Component({
  selector: 'app-qualifications-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="qual-page">

      <!-- ── Header ─────────────────────────────────────────── -->
      <div class="page-header">
        <div class="page-title-group">
          <div class="page-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V2m0 4a6 6 0 016 6v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a6 6 0 016-6z"/><path d="M9 22h6"/><path d="M12 18v2"/></svg></div>
          <div>
            <h1>Teacher Qualifications</h1>
            <p>Manage which teachers are qualified to teach which subjects</p>
          </div>
        </div>
        <button class="btn btn--primary" (click)="showAddPanel.set(true)" [disabled]="showAddPanel()">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z"/></svg>
          Add Qualification
        </button>
      </div>

      <!-- ── Add Panel ──────────────────────────────────────── -->
      @if (showAddPanel()) {
        <div class="add-panel">
          <div class="add-panel-head">
            <h3>{{ bulkMode() ? 'Bulk Add Qualifications' : 'Add Qualification' }}</h3>
            <button class="btn-ghost-icon" (click)="cancelAdd()" aria-label="Close">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>
            </button>
          </div>

          <form [formGroup]="qualForm" class="add-form">
            <div class="add-form-row">
              <div class="form-field">
                <label class="field-label">Teacher <span class="required">*</span></label>
                <div class="select-wrap">
                  <select class="field-select" formControlName="teacher">
                    <option value="">— Select Teacher —</option>
                    @for (t of teachers(); track t.id) {
                      <option [ngValue]="t.id">{{ t.full_name }}</option>
                    }
                  </select>
                  <svg class="sel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>

              @if (bulkMode()) {
                <div class="form-field bulk-subjects">
                  <label class="field-label">Subjects <span class="required">*</span></label>
                  <div class="subject-checklist">
                    @for (sub of subjects(); track sub.id) {
                      <label class="check-row" [class.check-row--checked]="selectedSubjectIds().has(sub.id)">
                        <input type="checkbox" [checked]="selectedSubjectIds().has(sub.id)" (change)="toggleSubject(sub.id)" />
                        <span class="check-mark"></span>
                        <span class="check-label">{{ sub.name }}</span>
                      </label>
                    }
                  </div>
                  <span class="field-hint">Checked subjects will be added</span>
                </div>
              } @else {
                <div class="form-field">
                  <label class="field-label">Subject <span class="required">*</span></label>
                  <div class="select-wrap">
                    <select class="field-select" formControlName="subject">
                      <option value="">— Select Subject —</option>
                      @for (sub of subjects(); track sub.id) {
                        <option [ngValue]="sub.id">{{ sub.name }}</option>
                      }
                    </select>
                    <svg class="sel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              }
            </div>

            @if (addError()) {
              <div class="add-error">{{ addError() }}</div>
            }

            <div class="add-actions">
              <button type="button" class="btn btn--ghost" (click)="toggleBulkMode()">
                {{ bulkMode() ? 'Single Mode' : 'Bulk Mode' }}
              </button>
              <button type="button" class="btn btn--primary" (click)="submitAdd()" [disabled]="addSubmitting() || !canAdd()">
                @if (addSubmitting()) {
                  <span class="spinner"></span> Adding…
                } @else {
                  {{ bulkMode() ? 'Add All' : 'Add' }}
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- ── Error Banner ───────────────────────────────────── -->
      @if (error()) {
        <div class="error-banner">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/></svg>
          <span>{{ error() }}</span>
          <button class="banner-dismiss" (click)="error.set('')">&times;</button>
        </div>
      }

      <!-- ── Table ───────────────────────────────────────────── -->
      <div class="table-wrap">
        @if (loading()) {
          <div class="table-loader"><span class="spinner"></span> Loading qualifications…</div>
        } @else if (qualifications().length === 0) {
          <div class="table-empty">
            <svg viewBox="0 0 40 40" fill="none" stroke="#d1d5db" stroke-width="2"><path d="M20 10v20M10 20h20" stroke-linecap="round"/></svg>
            <p>No qualifications yet. Add one above.</p>
          </div>
        } @else {
          <table class="qual-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Created</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (q of qualifications(); track q.id) {
                <tr>
                  <td class="td-teacher">{{ q.staff_name }}</td>
                  <td><span class="subject-badge">{{ q.subject_name }}</span></td>
                  <td class="td-date">{{ q.created_at | date:'mediumDate' }}</td>
                  <td class="td-actions">
                    <button class="btn-icon btn-icon--danger" (click)="confirmRemove(q)" title="Remove qualification">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

    </div>
  `,
  styles: [`
    .qual-page {
      font-family: 'Inter', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1000px;
    }
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }
    .page-title-group {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .page-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(124,58,237,0.30);
      svg { width: 22px; height: 22px; stroke: #fff; }
    }
    .page-title-group h1 {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px;
    }
    .page-title-group p {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }

    /* ── Buttons ───────────────────────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      line-height: 1.3;
      svg { width: 14px; height: 14px; flex-shrink: 0; fill: currentColor; }
      &--primary {
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        color: #fff;
        box-shadow: 0 2px 8px rgba(124,58,237,0.30);
        &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,0.40); }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
      &--ghost {
        background: #fff;
        color: #374151;
        border: 1.5px solid #e5e7eb;
        &:hover { background: #f9fafb; border-color: #d1d5db; }
      }
    }
    .btn-ghost-icon {
      width: 30px; height: 30px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.14s ease;
      svg { width: 14px; height: 14px; fill: #6b7280; }
      &:hover { background: #fef2f2; border-color: #fecaca; svg { fill: #ef4444; } }
    }
    .btn-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: #fff;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.14s ease;
      svg { width: 15px; height: 15px; fill: #6b7280; }
      &--danger:hover { background: #fef2f2; border-color: #fecaca; svg { fill: #ef4444; } }
    }
    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Add Panel ─────────────────────────────────────────── */
    .add-panel {
      background: #fafafa;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 20px 22px;
      margin-bottom: 20px;
      animation: slideDown 0.2s ease both;
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .add-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      h3 { margin: 0; font-size: 15px; font-weight: 700; color: #111827; }
    }
    .add-form { display: flex; flex-direction: column; gap: 14px; }
    .add-form-row { display: flex; gap: 14px; }
    .add-form-row > .form-field { flex: 1; min-width: 0; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }
    .field-hint { font-size: 11.5px; color: #9ca3af; }

    .select-wrap { position: relative; }
    .field-select {
      width: 100%;
      padding: 9px 36px 9px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 13.5px;
      font-family: inherit;
      color: #111827;
      background: #fff;
      appearance: none;
      cursor: pointer;
      transition: border-color 0.15s ease;
      &:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
    }
    ::ng-deep .field-select option {
      color: #111827 !important;
      background: #fff !important;
    }
    .sel-chevron {
      position: absolute;
      right: 11px; top: 50%;
      transform: translateY(-50%);
      width: 15px; height: 15px;
      stroke: #9ca3af;
      pointer-events: none;
    }

    .subject-checklist {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 8px 10px;
      background: #fff;
    }
    .check-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 6px;
      border-radius: 7px;
      cursor: pointer;
      font-size: 13px;
      color: #374151;
      transition: background 0.12s ease;
      &:hover { background: #f3f0ff; }
      input { display: none; }
      .check-mark {
        width: 16px; height: 16px;
        border: 1.5px solid #d1d5db;
        border-radius: 4px;
        flex-shrink: 0;
        transition: all 0.12s ease;
      }
      &--checked .check-mark {
        background: #7c3aed;
        border-color: #7c3aed;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 12 12' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10.28 2.72a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L4.25 7.69l4.97-4.97a.75.75 0 011.06 0z'/%3E%3C/svg%3E");
        background-size: 10px;
        background-position: center;
        background-repeat: no-repeat;
      }
    }

    .add-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      color: #dc2626;
    }
    .add-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* ── Error Banner ──────────────────────────────────────── */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #dc2626;
      svg { width: 15px; height: 15px; fill: #dc2626; flex-shrink: 0; }
    }
    .banner-dismiss {
      margin-left: auto;
      background: none; border: none;
      font-size: 18px; cursor: pointer;
      color: #9ca3af;
      &:hover { color: #dc2626; }
    }

    /* ── Table ─────────────────────────────────────────────── */
    .table-wrap {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      overflow: hidden;
    }
    .table-loader, .table-empty {
      padding: 48px 20px;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      .spinner { border-color: #e5e7eb; border-top-color: #7c3aed; }
      svg { width: 36px; height: 36px; margin-bottom: 8px; }
    }
    .table-empty p { margin: 0; }

    .qual-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      th {
        text-align: left;
        padding: 12px 14px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b7280;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }
      td {
        padding: 12px 14px;
        border-bottom: 1px solid #f3f4f6;
        color: #374151;
      }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #fafafa; }
    }
    .td-teacher { font-weight: 600; color: #111827; }
    .subject-badge {
      background: #f3f0ff;
      color: #7c3aed;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .td-date { color: #9ca3af; font-size: 12.5px; }
    .th-actions, .td-actions { width: 50px; text-align: center; }
  `],
})
export class QualificationsPageComponent implements OnInit {
  private academicsService = inject(AcademicsService);
  private snackbar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  qualifications = this.academicsService.qualifications;
  subjects = this.academicsService.subjects;
  teachers = signal<TeacherSelect[]>([]);
  loading = signal(false);
  error = signal('');
  showAddPanel = signal(false);
  addSubmitting = signal(false);
  addError = signal('');
  bulkMode = signal(false);
  selectedSubjectIds = signal<Set<number>>(new Set());

  qualForm: FormGroup;

  constructor() {
    this.qualForm = this.fb.group({
      teacher: ['', Validators.required],
      subject: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.academicsService.getSubjects().subscribe({
      complete: () => this.checkLoaded(),
      error: () => this.checkLoaded(),
    });
    this.academicsService.getTeachers().subscribe({
      next: (t) => { this.teachers.set(t); this.checkLoaded(); },
      error: (err) => { this.error.set(err?.message || 'Failed to load teachers'); this.checkLoaded(); },
    });
    this.academicsService.getQualifications().subscribe({
      complete: () => this.checkLoaded(),
      error: () => this.checkLoaded(),
    });
  }

  private checkLoaded(): void {
    this.loading.set(false);
  }

  get canAdd(): () => boolean {
    return () => {
      if (this.qualForm.get('teacher')?.invalid) return false;
      if (this.bulkMode()) return this.selectedSubjectIds().size > 0;
      return this.qualForm.get('subject')?.valid ?? false;
    };
  }

  toggleBulkMode(): void {
    this.bulkMode.update(v => !v);
    this.selectedSubjectIds.set(new Set());
    this.addError.set('');
  }

  toggleSubject(subjectId: number): void {
    const set = new Set(this.selectedSubjectIds());
    if (set.has(subjectId)) { set.delete(subjectId); }
    else { set.add(subjectId); }
    this.selectedSubjectIds.set(set);
  }

  cancelAdd(): void {
    this.showAddPanel.set(false);
    this.qualForm.reset({ teacher: '', subject: '' });
    this.selectedSubjectIds.set(new Set());
    this.addError.set('');
    this.bulkMode.set(false);
  }

  submitAdd(): void {
    if (this.addSubmitting()) return;
    const teacherId = this.qualForm.value.teacher;
    if (!teacherId) return;

    const subjectIds = this.bulkMode()
      ? Array.from(this.selectedSubjectIds())
      : [this.qualForm.value.subject];

    if (subjectIds.length === 0 || subjectIds.some(id => !id)) return;

    this.addSubmitting.set(true);
    this.addError.set('');
    let completed = 0;
    let errors: string[] = [];

    subjectIds.forEach(subjectId => {
      this.academicsService.createQualification(teacherId, subjectId).subscribe({
        error: (err) => {
          const msg = err?.error?.detail || err?.error?.subject?.[0] || `Failed for subject #${subjectId}`;
          errors.push(msg);
          completed++;
          if (completed === subjectIds.length) this.finishAdd(errors);
        },
        complete: () => {
          completed++;
          if (completed === subjectIds.length) this.finishAdd(errors);
        },
      });
    });
  }

  private finishAdd(errors: string[]): void {
    this.addSubmitting.set(false);
    if (errors.length === 0) {
      this.snackbar.open('Qualification(s) added successfully', 'Close', { duration: 3000 });
      this.cancelAdd();
    } else {
      this.addError.set(errors[0]);
    }
  }

  confirmRemove(q: Qualification): void {
    if (!confirm(`Remove ${q.staff_name}'s qualification for ${q.subject_name}?`)) return;
    this.academicsService.deleteQualification(q.id).subscribe({
      next: () => this.snackbar.open('Qualification removed', 'Close', { duration: 2500 }),
      error: () => this.error.set('Failed to remove qualification'),
    });
  }
}

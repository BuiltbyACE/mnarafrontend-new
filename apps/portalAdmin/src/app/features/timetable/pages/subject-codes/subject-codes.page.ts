import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TimetableApiService, SubjectCode } from '@sms/domain/timetable';

const CATEGORIES = [
  'Core', 'Islamic', 'Science', 'Humanities',
  'Technical', 'Creative', 'Sport', 'Language', 'Literacy',
] as const;

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  Core:       { bg: 'bg-blue-100',    text: 'text-blue-700' },
  Islamic:    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Science:    { bg: 'bg-violet-100',  text: 'text-violet-700' },
  Humanities: { bg: 'bg-amber-100',   text: 'text-amber-700' },
  Technical:  { bg: 'bg-cyan-100',    text: 'text-cyan-700' },
  Creative:   { bg: 'bg-pink-100',    text: 'text-pink-700' },
  Sport:      { bg: 'bg-orange-100',  text: 'text-orange-700' },
  Language:   { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  Literacy:   { bg: 'bg-teal-100',    text: 'text-teal-700' },
};

@Component({
  selector: 'app-subject-codes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="p-6 max-w-[1200px] mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Subject Codes</h1>
          <p class="text-sm text-slate-500 mt-1">Manage subject codes used in timetable entries</p>
        </div>
        <button mat-flat-button color="primary" (click)="startCreate()">
          <mat-icon class="text-base mr-1">add</mat-icon>
          Add Subject
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="grid grid-cols-1 gap-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-16 rounded-xl bg-slate-100 animate-pulse"></div>
          }
        </div>
      }

      <!-- Error -->
      @if (errorMsg()) {
        <div class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700 mb-4">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0">error_outline</mat-icon>
          {{ errorMsg() }}
        </div>
      }

      <!-- Inline form -->
      @if (showForm()) {
        <div class="mb-6 p-5 rounded-2xl border border-primary/30 bg-primary/[0.03]">
          <h3 class="text-sm font-semibold text-slate-800 mb-4">
            {{ editingId() ? 'Edit Subject Code' : 'New Subject Code' }}
          </h3>
          <form [formGroup]="form" (ngSubmit)="save()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Code</mat-label>
              <input matInput formControlName="code" placeholder="e.g. ENG" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" placeholder="e.g. English Language" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                @for (c of categories; track c) {
                  <mat-option [value]="c">{{ c }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <div class="flex items-end gap-2">
              <button type="submit" mat-flat-button color="primary" [disabled]="saving() || form.invalid">
                {{ saving() ? 'Saving…' : (editingId() ? 'Update' : 'Create') }}
              </button>
              <button type="button" mat-stroked-button (click)="cancelForm()">Cancel</button>
            </div>
            @if (savingError()) {
              <div class="col-span-full text-sm text-red-600">{{ savingError() }}</div>
            }
          </form>
        </div>
      }

      <!-- Subject list -->
      @if (!loading() && subjects().length > 0) {
        <div class="overflow-x-auto rounded-2xl border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 font-semibold text-slate-600">Code</th>
                <th class="text-left px-4 py-3 font-semibold text-slate-600">Full Name</th>
                <th class="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                <th class="text-center px-4 py-3 font-semibold text-slate-600">Active</th>
                <th class="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (s of subjects(); track s.id) {
                <tr class="hover:bg-slate-50/50 transition-colors duration-150"
                    [class.opacity-50]="!s.is_active">
                  <td class="px-4 py-3">
                    <span class="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-800 tracking-wider border border-slate-200">
                      {{ s.code }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-700 font-medium">{{ s.full_name }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          [class]="categoryStyle(s.category).bg + ' ' + categoryStyle(s.category).text">
                      {{ s.category }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <mat-slide-toggle [checked]="s.is_active"
                                      (change)="toggleActive(s)"
                                      [matTooltip]="s.is_active ? 'Deactivate' : 'Activate'"
                                      color="primary">
                    </mat-slide-toggle>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button mat-icon-button (click)="startEdit(s)" matTooltip="Edit">
                      <mat-icon fontSet="material-icons-outlined" class="text-base">edit</mat-icon>
                    </button>
                    <button mat-icon-button (click)="confirmDelete(s)" matTooltip="Delete">
                      <mat-icon fontSet="material-icons-outlined" class="text-base text-red-400 hover:text-red-600">delete_outline</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !errorMsg() && subjects().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <mat-icon fontSet="material-icons-outlined" class="text-3xl text-slate-400">book</mat-icon>
          </div>
          <h3 class="text-base font-semibold text-slate-700">No subject codes</h3>
          <p class="text-sm text-slate-400 mt-1">Add subject codes to use when creating timetable entries.</p>
          <button mat-flat-button color="primary" class="mt-6" (click)="startCreate()">
            <mat-icon class="text-base mr-1">add</mat-icon>
            Add First Subject
          </button>
        </div>
      }
    </div>
  `,
})
export class SubjectCodesPage implements OnInit {
  private api = inject(TimetableApiService);
  private fb = inject(FormBuilder);

  protected categories = CATEGORIES;
  protected subjects = signal<SubjectCode[]>([]);
  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);
  protected showForm = signal(false);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);
  protected savingError = signal<string | null>(null);

  protected categoryStyle = (cat: string) => CATEGORY_STYLE[cat] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };

  protected form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    full_name: ['', Validators.required],
    category: ['Core' as string, Validators.required],
  });

  ngOnInit(): void {
    this.loadSubjects();
  }

  private loadSubjects(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.getSubjectCodes().subscribe({
      next: (list) => { this.subjects.set(list); this.loading.set(false); },
      error: (err) => { this.errorMsg.set(`Failed to load subjects (${err.status})`); this.loading.set(false); },
    });
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ code: '', full_name: '', category: 'Core' });
    this.savingError.set(null);
    this.showForm.set(true);
  }

  protected startEdit(s: SubjectCode): void {
    this.editingId.set(s.id);
    this.form.patchValue(s);
    this.savingError.set(null);
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
    this.savingError.set(null);
  }

  protected save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.savingError.set(null);
    const data = this.form.getRawValue();
    const obs$ = this.editingId()
      ? this.api.updateSubjectCode(this.editingId()!, data)
      : this.api.createSubjectCode(data);
    obs$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadSubjects();
      },
      error: (err) => {
        this.saving.set(false);
        this.savingError.set(err.error?.detail ?? err.error?.code?.[0] ?? `Save failed (${err.status})`);
      },
    });
  }

  protected toggleActive(s: SubjectCode): void {
    this.api.updateSubjectCode(s.id, { is_active: !s.is_active }).subscribe({
      next: () => this.loadSubjects(),
      error: (err) => alert(err.error?.detail ?? `Update failed (${err.status})`),
    });
  }

  protected confirmDelete(s: SubjectCode): void {
    const ok = confirm(`Delete "${s.code} - ${s.full_name}"?`);
    if (!ok) return;
    this.api.deleteSubjectCode(s.id).subscribe({
      next: () => this.loadSubjects(),
      error: (err) => alert(err.error?.detail ?? `Delete failed (${err.status})`),
    });
  }
}

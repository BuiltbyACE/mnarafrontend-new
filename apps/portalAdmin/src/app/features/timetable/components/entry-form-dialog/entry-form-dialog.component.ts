import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  TimetableApiService,
  TimetableEntry,
  TieredPeriod,
  DAY_LABELS,
} from '@sms/domain/timetable';

interface EntryFormData {
  entry: TimetableEntry | null;
  periodId: number;
  dayOfWeek: number;
  draftVersionId: number;
  academicTermId: number;
}

interface DropdownOption { id: number; label: string; }

@Component({
  selector: 'app-entry-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="p-6 w-full max-w-lg">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <mat-icon fontSet="material-icons-outlined" class="text-xl text-primary">
            {{ isEdit() ? 'edit_calendar' : 'add_box' }}
          </mat-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-900">
            {{ isEdit() ? 'Edit Entry' : 'New Timetable Entry' }}
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ dayLabel() }} · {{ periodHint() }}
          </p>
        </div>
      </div>

      <!-- Form-level error -->
      @if (formError()) {
        <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0 text-base mt-0.5">
            error_outline
          </mat-icon>
          <span class="text-sm text-red-700">{{ formError() }}</span>
        </div>
      }

      <!-- Validation warnings -->
      @if (validationWarnings().length > 0) {
        <div class="mb-4 space-y-1">
          @for (w of validationWarnings(); track w) {
            <div class="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200
                        rounded-lg px-3 py-2">
              <mat-icon fontSet="material-icons-outlined" class="text-amber-500 text-sm shrink-0">
                warning_amber
              </mat-icon>
              {{ w }}
            </div>
          }
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <!-- Year Group -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Year Group / Class</mat-label>
          <mat-select formControlName="year_group">
            @for (opt of yearGroups(); track opt.id) {
              <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
            }
          </mat-select>
          @if (form.get('year_group')?.hasError('required') && form.get('year_group')?.touched) {
            <mat-error>Year group is required</mat-error>
          }
        </mat-form-field>

        <!-- Teacher -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Teacher</mat-label>
          <mat-select formControlName="teacher">
            @for (opt of teachers(); track opt.id) {
              <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
            }
          </mat-select>
          @if (form.get('teacher')?.hasError('required') && form.get('teacher')?.touched) {
            <mat-error>Teacher is required</mat-error>
          }
        </mat-form-field>

        <!-- Subject -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Subject</mat-label>
          <mat-select formControlName="subject">
            @for (opt of subjects(); track opt.id) {
              <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
            }
          </mat-select>
          @if (form.get('subject')?.hasError('required') && form.get('subject')?.touched) {
            <mat-error>Subject is required</mat-error>
          }
        </mat-form-field>

        <!-- Room (optional) -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Room (optional)</mat-label>
          <mat-select formControlName="room">
            <mat-option [value]="null">— No specific room —</mat-option>
            @for (opt of rooms(); track opt.id) {
              <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Practical checkbox -->
        <div class="flex items-center gap-2">
          <mat-checkbox formControlName="is_practical" color="primary">
            <span class="text-sm text-slate-700">Practical / Lab session</span>
          </mat-checkbox>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" mat-stroked-button [mat-dialog-close]="undefined" [disabled]="submitting()">
            Cancel
          </button>
          @if (isEdit()) {
            <button type="button" mat-stroked-button color="warn"
                    (click)="deleteEntry()" [disabled]="submitting()">
              Delete
            </button>
          }
          <button type="submit" mat-flat-button color="primary"
                  [disabled]="submitting() || validating() || form.invalid">
            @if (submitting()) {
              <span class="inline-flex items-center gap-1.5">
                <span class="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                Saving...
              </span>
            } @else {
              {{ isEdit() ? 'Save Changes' : 'Add Entry' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class EntryFormDialogComponent implements OnInit {
  readonly data = inject<EntryFormData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<EntryFormDialogComponent>);
  private api = inject(TimetableApiService);
  private fb = inject(FormBuilder);

  protected isEdit = computed(() => !!this.data.entry);
  protected dayLabel = computed(() => DAY_LABELS[this.data.dayOfWeek as 0|1|2|3|4] ?? '');
  protected periodHint = signal('');

  protected yearGroups = signal<DropdownOption[]>([]);
  protected teachers = signal<DropdownOption[]>([]);
  protected subjects = signal<DropdownOption[]>([]);
  protected rooms = signal<DropdownOption[]>([]);

  protected formError = signal<string | null>(null);
  protected validationWarnings = signal<string[]>([]);
  protected validating = signal(false);
  protected submitting = signal(false);

  protected form = this.fb.nonNullable.group({
    year_group: [0 as number, [Validators.required, Validators.min(1)]],
    teacher:    [0 as number, [Validators.required, Validators.min(1)]],
    subject:    [0 as number, [Validators.required, Validators.min(1)]],
    room:       [null as number | null],
    is_practical: [false],
  });

  ngOnInit(): void {
    this.loadDropdowns();
    if (this.data.entry) {
      const e = this.data.entry;
      this.form.patchValue({
        year_group:   e.year_group,
        teacher:      e.teacher,
        subject:      e.subject,
        room:         e.room ?? null,
        is_practical: e.is_practical,
      });
    }
    this.form.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(() => this.runValidation());
  }

  private loadDropdowns(): void {
    this.api.getTeachers().subscribe({
      next: (list) => this.teachers.set(list.map((t) => ({ id: t.id, label: t.name }))),
    });
    (this.api as any).getSubjectCodes?.()?.subscribe?.({
      next: (list: any[]) => this.subjects.set(
        list.map((s) => ({ id: s.id, label: `${s.code} – ${s.full_name}` }))
      ),
    });
    (this.api as any).getYearGroups?.()?.subscribe?.({
      next: (list: any[]) => this.yearGroups.set(
        list.map((yg) => ({ id: yg.id, label: yg.name }))
      ),
    });
    (this.api as any).getRooms?.()?.subscribe?.({
      next: (list: any[]) => this.rooms.set(
        list.map((r) => ({ id: r.id, label: r.name }))
      ),
    });
  }

  private runValidation(): void {
    const v = this.form.getRawValue();
    if (!v.teacher || !v.year_group || !v.subject) return;
    this.validating.set(true);
    this.api.validateEntry({
      teacher_id:       v.teacher,
      year_group_id:    v.year_group,
      tiered_period_id: this.data.periodId,
      day_of_week:      this.data.dayOfWeek,
      subject_id:       v.subject,
      room_id:          v.room ?? undefined,
      academic_term_id: this.data.academicTermId,
    }).subscribe({
      next: (res) => {
        this.validationWarnings.set(
          res.warnings?.map((w: any) => w.message ?? String(w)) ?? []
        );
        this.validating.set(false);
      },
      error: () => this.validating.set(false),
    });
  }

  protected submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.formError.set(null);

    const v = this.form.getRawValue();
    const payload = {
      academic_term:     this.data.academicTermId,
      timetable_version: this.data.draftVersionId,
      day_of_week:       this.data.dayOfWeek,
      tiered_period:     this.data.periodId,
      year_group:        v.year_group,
      teacher:           v.teacher,
      subject:           v.subject,
      room:              v.room ?? undefined,
      is_practical:      v.is_practical,
    };

    const action$ = this.isEdit()
      ? this.api.updateEntry(this.data.entry!.id, payload)
      : this.api.createEntry(payload);

    action$.subscribe({
      next: (entry) => {
        this.submitting.set(false);
        this.dialogRef.close({ entry, deleted: false });
      },
      error: (err) => {
        this.submitting.set(false);
        const detail = err.error?.detail
          || err.error?.non_field_errors?.[0]
          || err.error?.timetable_version?.[0]
          || Object.values(err.error ?? {})?.[0]
          || `Request failed (${err.status})`;
        this.formError.set(String(detail));
      },
    });
  }

  protected deleteEntry(): void {
    if (!this.data.entry) return;
    this.submitting.set(true);
    this.api.deleteEntry(this.data.entry.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.dialogRef.close({ entry: this.data.entry, deleted: true });
      },
      error: (err) => {
        this.submitting.set(false);
        this.formError.set(err.error?.detail ?? `Delete failed (${err.status})`);
      },
    });
  }
}

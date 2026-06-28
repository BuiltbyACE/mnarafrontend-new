import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AcademicTerm, TimetableApiService } from '@sms/domain/timetable';

@Component({
  selector: 'app-create-version-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="p-6 w-full">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <mat-icon fontSet="material-icons-outlined" class="text-xl text-primary">add_box</mat-icon>
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-900">Create Draft Version</h2>
          <p class="text-xs text-slate-500 mt-0.5">Start a new timetable draft for a term</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Version Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Term 1 2026 – Draft A" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Academic Term</mat-label>
          <mat-select formControlName="academic_term">
            @if (loadingTerms()) {
              <mat-option disabled>Loading terms...</mat-option>
            } @else {
              @for (t of terms(); track t.id) {
                <mat-option [value]="t.id">{{ t.name }}</mat-option>
              }
            }
          </mat-select>
          @if (form.get('academic_term')?.hasError('required') && form.get('academic_term')?.touched) {
            <mat-error>Academic term is required</mat-error>
          }
        </mat-form-field>

        @if (errorMsg()) {
          <div class="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
            <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0 text-base">error_outline</mat-icon>
            {{ errorMsg() }}
          </div>
        }

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" mat-stroked-button [mat-dialog-close]="undefined" [disabled]="loading()">
            Cancel
          </button>
          <button type="submit" mat-flat-button color="primary" [disabled]="loading() || form.invalid">
            @if (loading()) {
              <span class="inline-flex items-center gap-1.5">
                <span class="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                Creating...
              </span>
            } @else {
              Create Draft
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CreateVersionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateVersionDialogComponent>);
  private api = inject(TimetableApiService);

  protected terms = signal<AcademicTerm[]>([]);
  protected loadingTerms = signal(false);
  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    academic_term: [0 as number, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadTerms();
  }

  private loadTerms(): void {
    this.loadingTerms.set(true);
    this.api.getAcademicTerms().subscribe({
      next: (list) => {
        this.terms.set(list);
        this.loadingTerms.set(false);
      },
      error: () => this.loadingTerms.set(false),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMsg.set(null);
    const { name, academic_term } = this.form.getRawValue();
    this.api.createVersion({ name, academic_term }).subscribe({
      next: (version) => {
        this.loading.set(false);
        this.dialogRef.close(version);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.detail || err.error?.name?.[0] || err.error?.academic_term?.[0] || `Failed to create version (${err.status})`;
        this.errorMsg.set(msg);
      },
    });
  }
}

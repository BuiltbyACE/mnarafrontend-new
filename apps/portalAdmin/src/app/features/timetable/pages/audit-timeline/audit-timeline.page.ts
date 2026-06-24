import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { debounceTime } from 'rxjs/operators';
import {
  TimetableApiService,
  TimetableStateService,
  TimetableVersion,
  AuditLogEntry,
  AuditAction,
  AuditEntityType,
  AuditLogFilter,
} from '@sms/domain/timetable';

const ACTION_ICONS: Record<AuditAction, { icon: string; color: string; label: string }> = {
  CREATE:   { icon: 'add_circle_outline',    color: 'text-emerald-600 bg-emerald-50', label: 'Created' },
  UPDATE:   { icon: 'edit',                  color: 'text-blue-600 bg-blue-50',       label: 'Updated' },
  DELETE:   { icon: 'delete_outline',        color: 'text-red-600 bg-red-50',         label: 'Deleted' },
  PUBLISH:  { icon: 'publish',               color: 'text-emerald-700 bg-emerald-100',label: 'Published' },
  ARCHIVE:  { icon: 'archive',               color: 'text-slate-500 bg-slate-100',    label: 'Archived' },
  ROLLBACK: { icon: 'restore',               color: 'text-amber-700 bg-amber-50',     label: 'Rolled Back' },
  CLONE:    { icon: 'content_copy',          color: 'text-violet-600 bg-violet-50',   label: 'Cloned' },
};

const PAGE_SIZE = 20;

@Component({
  selector: 'app-audit-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    DatePipe,
  ],
  template: `
    <div class="p-6 max-w-[960px] mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Audit Timeline</h1>
          <p class="text-sm text-slate-500 mt-1">All timetable changes, ordered most-recent first</p>
        </div>
        <a routerLink="/admin/timetable/versions"
           class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <mat-icon fontSet="material-icons-outlined" class="text-base">layers</mat-icon>
          Back to Versions
        </a>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <form [formGroup]="filterForm" class="flex flex-wrap gap-3 items-end">
          <!-- Version filter -->
          <mat-form-field appearance="outline" class="w-56 !pb-0">
            <mat-label>Version</mat-label>
            <mat-select formControlName="version">
              <mat-option [value]="null">All versions</mat-option>
              @for (v of versions(); track v.id) {
                <mat-option [value]="v.id">{{ v.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Action filter -->
          <mat-form-field appearance="outline" class="w-44 !pb-0">
            <mat-label>Action</mat-label>
            <mat-select formControlName="action">
              <mat-option [value]="null">All actions</mat-option>
              @for (a of actionOptions; track a.value) {
                <mat-option [value]="a.value">{{ a.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Entity type filter -->
          <mat-form-field appearance="outline" class="w-48 !pb-0">
            <mat-label>Entity Type</mat-label>
            <mat-select formControlName="entity_type">
              <mat-option [value]="null">All entities</mat-option>
              @for (e of entityOptions; track e.value) {
                <mat-option [value]="e.value">{{ e.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Date from -->
          <mat-form-field appearance="outline" class="w-44 !pb-0">
            <mat-label>From</mat-label>
            <input matInput type="date" formControlName="date_from" />
          </mat-form-field>

          <!-- Date to -->
          <mat-form-field appearance="outline" class="w-44 !pb-0">
            <mat-label>To</mat-label>
            <input matInput type="date" formControlName="date_to" />
          </mat-form-field>

          <button type="button" mat-stroked-button (click)="clearFilters()" class="h-10">
            <mat-icon fontSet="material-icons-outlined" class="text-base">clear</mat-icon>
            Clear
          </button>
        </form>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="flex gap-4">
              <div class="w-9 h-9 rounded-full bg-slate-100 shrink-0 animate-pulse"></div>
              <div class="flex-1 space-y-2 pt-1">
                <div class="h-4 w-1/3 bg-slate-100 rounded animate-pulse"></div>
                <div class="h-3 w-2/3 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error -->
      @if (errorMsg()) {
        <div class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0">error_outline</mat-icon>
          {{ errorMsg() }}
        </div>
      }

      <!-- Timeline -->
      @if (!loading() && auditLog().length > 0) {
        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute left-[17px] top-0 bottom-0 w-px bg-slate-200"></div>

          <ol class="space-y-4 pl-0">
            @for (entry of auditLog(); track entry.id) {
              <li class="flex gap-4">
                <!-- Icon -->
                <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10
                            {{ actionMeta(entry.action).color }}">
                  <mat-icon fontSet="material-icons-outlined" class="text-base">
                    {{ actionMeta(entry.action).icon }}
                  </mat-icon>
                </div>

                <!-- Content -->
                <div class="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4 min-w-0">
                  <div class="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span class="text-sm font-semibold text-slate-800">
                        {{ actionMeta(entry.action).label }}
                      </span>
                      <span class="text-sm text-slate-500 ml-1.5">{{ entry.entity_type }}</span>
                      @if (entry.entity_id) {
                        <span class="text-xs text-slate-400 ml-1">#{{ entry.entity_id }}</span>
                      }
                    </div>
                    <time class="text-xs text-slate-400 whitespace-nowrap">
                      {{ entry.timestamp | date:'d MMM y, HH:mm' }}
                    </time>
                  </div>

                  <div class="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                    <span class="flex items-center gap-1">
                      <mat-icon fontSet="material-icons-outlined" class="text-[13px]">person_outline</mat-icon>
                      {{ entry.user_name }}
                    </span>
                    @if (entry.version_name) {
                      <span class="flex items-center gap-1">
                        <mat-icon fontSet="material-icons-outlined" class="text-[13px]">layers</mat-icon>
                        {{ entry.version_name }}
                      </span>
                    }
                  </div>

                  @if (entry.detail && objectKeys(entry.detail).length > 0) {
                    <div class="mt-2 p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 font-mono overflow-x-auto">
                      @for (k of objectKeys(entry.detail); track k) {
                        <div class="flex gap-2">
                          <span class="text-slate-400 shrink-0">{{ k }}:</span>
                          <span>{{ entry.detail![k] }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              </li>
            }
          </ol>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-6">
          <span class="text-sm text-slate-400">
            Showing {{ pageStart() }}–{{ pageEnd() }} of {{ totalCount() }}
          </span>
          <div class="flex items-center gap-2">
            <button mat-stroked-button [disabled]="currentPage() === 1" (click)="prevPage()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="text-sm font-medium text-slate-700 px-2">Page {{ currentPage() }}</span>
            <button mat-stroked-button [disabled]="!hasNextPage()" (click)="nextPage()">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && !errorMsg() && auditLog().length === 0) {
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <mat-icon fontSet="material-icons-outlined" class="text-4xl text-slate-300 mb-3">history</mat-icon>
          <p class="text-sm font-semibold text-slate-500">No audit entries found</p>
          <p class="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
        </div>
      }
    </div>
  `,
})
export class AuditTimelinePage implements OnInit {
  private api = inject(TimetableApiService);
  private state = inject(TimetableStateService);
  private fb = inject(FormBuilder);

  protected auditLog = this.state.auditLog;
  protected versions = this.state.versions;

  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);
  protected totalCount = signal(0);
  protected currentPage = signal(1);

  protected hasNextPage = computed(() =>
    this.currentPage() * PAGE_SIZE < this.totalCount()
  );
  protected pageStart = computed(() => (this.currentPage() - 1) * PAGE_SIZE + 1);
  protected pageEnd = computed(() =>
    Math.min(this.currentPage() * PAGE_SIZE, this.totalCount())
  );

  protected filterForm = this.fb.group({
    version:     [null as number | null],
    action:      [null as AuditAction | null],
    entity_type: [null as AuditEntityType | null],
    date_from:   [null as string | null],
    date_to:     [null as string | null],
  });

  readonly actionOptions: { value: AuditAction; label: string }[] = [
    { value: 'CREATE',   label: 'Created' },
    { value: 'UPDATE',   label: 'Updated' },
    { value: 'DELETE',   label: 'Deleted' },
    { value: 'PUBLISH',  label: 'Published' },
    { value: 'ARCHIVE',  label: 'Archived' },
    { value: 'ROLLBACK', label: 'Rolled Back' },
    { value: 'CLONE',    label: 'Cloned' },
  ];

  readonly entityOptions: { value: AuditEntityType; label: string }[] = [
    { value: 'TimetableVersion', label: 'Version' },
    { value: 'TimetableEntry',   label: 'Entry' },
    { value: 'BellSchedule',     label: 'Bell Schedule' },
    { value: 'TieredPeriod',     label: 'Period' },
  ];

  ngOnInit(): void {
    if (this.state.versions().length === 0) {
      this.api.getVersions().subscribe({
        next: (list) => this.state.setVersions(list),
      });
    }
    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadLog();
    });
    this.loadLog();
  }

  private loadLog(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    const f = this.filterForm.getRawValue();
    const filters: AuditLogFilter = {
      page: this.currentPage(),
      ...(f.version     != null ? { version: f.version }         : {}),
      ...(f.action      != null ? { action: f.action }           : {}),
      ...(f.entity_type != null ? { entity_type: f.entity_type } : {}),
      ...(f.date_from        ? { date_from: f.date_from }        : {}),
      ...(f.date_to          ? { date_to: f.date_to }            : {}),
    };
    this.api.getAuditLog(filters).subscribe({
      next: (res) => {
        this.state.setAuditLog(res.results);
        this.totalCount.set(res.count);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(`Failed to load audit log (${err.status})`);
        this.loading.set(false);
      },
    });
  }

  protected clearFilters(): void {
    this.filterForm.reset({ version: null, action: null, entity_type: null, date_from: null, date_to: null });
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadLog();
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.update((p) => p + 1);
      this.loadLog();
    }
  }

  protected actionMeta(action: AuditAction) {
    return ACTION_ICONS[action] ?? { icon: 'info', color: 'text-slate-500 bg-slate-100', label: action };
  }

  protected objectKeys(obj: Record<string, unknown>): string[] {
    return Object.keys(obj);
  }
}

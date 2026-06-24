import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import {
  TimetableApiService,
  TimetableStateService,
  TimetableVersion,
  CompareEntry,
  ModifiedEntry,
} from '@sms/domain/timetable';
import { VersionStatusBadgeComponent } from '../../components/version-status-badge/version-status-badge.component';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

@Component({
  selector: 'app-version-compare',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    FormsModule,
    VersionStatusBadgeComponent,
  ],
  template: `
    <div class="p-6 max-w-[1200px] mx-auto">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <a routerLink="/admin/timetable/versions" class="hover:text-slate-700 transition-colors">
          Timetable Versions
        </a>
        <mat-icon class="text-base">chevron_right</mat-icon>
        <a [routerLink]="['/admin/timetable/versions', versionAId()]"
           class="hover:text-slate-700 transition-colors">
          Version {{ versionAId() }}
        </a>
        <mat-icon class="text-base">chevron_right</mat-icon>
        <span class="text-slate-700 font-medium">Compare</span>
      </nav>

      <!-- Compare header -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
        <div class="grid grid-cols-2 gap-6">
          <!-- Version A -->
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Version A</p>
            @if (versionA(); as a) {
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-slate-800">{{ a.name }}</span>
                <app-version-status-badge [status]="a.status" />
              </div>
              <p class="text-xs text-slate-400 mt-1">{{ a.academic_term_name }}</p>
            } @else {
              <div class="h-6 w-48 bg-slate-100 rounded animate-pulse"></div>
            }
          </div>

          <!-- Version B selector -->
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Version B</p>
            <div class="flex items-center gap-3 flex-wrap">
              @if (otherVersions().length > 0) {
                <mat-select [(ngModel)]="selectedWithId"
                            (ngModelChange)="onWithChange($event)"
                            class="text-sm"
                            placeholder="Select a version to compare">
                  @for (v of otherVersions(); track v.id) {
                    <mat-option [value]="v.id">{{ v.name }} ({{ v.status }})</mat-option>
                  }
                </mat-select>
              } @else {
                <span class="text-xs text-slate-400 italic">Loading versions…</span>
              }
              @if (versionB(); as b) {
                <app-version-status-badge [status]="b.status" />
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <div class="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p class="text-sm">Comparing versions…</p>
        </div>
      }

      <!-- Error -->
      @if (errorMsg()) {
        <div class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700">
          <mat-icon fontSet="material-icons-outlined" class="text-red-500 shrink-0">error_outline</mat-icon>
          {{ errorMsg() }}
        </div>
      }

      <!-- No version B selected -->
      @if (!loading() && !errorMsg() && !compareResult()) {
        <div class="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
          <mat-icon fontSet="material-icons-outlined" class="text-4xl mb-3">compare_arrows</mat-icon>
          <p class="text-sm font-medium text-slate-500">Select a version above to compare</p>
          <p class="text-xs mt-1">Differences will appear here</p>
        </div>
      }

      <!-- Compare results -->
      @if (!loading() && compareResult(); as result) {
        <!-- Summary -->
        <div class="flex items-center gap-4 mb-5 flex-wrap">
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-700">
            <mat-icon class="text-base">add_circle_outline</mat-icon>
            {{ result.summary.added_count }} added
          </div>
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm font-semibold text-red-700">
            <mat-icon class="text-base">remove_circle_outline</mat-icon>
            {{ result.summary.removed_count }} removed
          </div>
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-700">
            <mat-icon class="text-base">edit_note</mat-icon>
            {{ result.summary.modified_count }} modified
          </div>
          @if (result.summary.added_count === 0 && result.summary.removed_count === 0 && result.summary.modified_count === 0) {
            <div class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600">
              <mat-icon fontSet="material-icons-outlined" class="text-base">check_circle_outline</mat-icon>
              Versions are identical
            </div>
          }
        </div>

        <!-- Added -->
        @if (result.added.length > 0) {
          <section class="mb-6">
            <h2 class="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <mat-icon class="text-base">add_circle_outline</mat-icon>
              Added ({{ result.added.length }})
            </h2>
            <div class="rounded-xl border border-emerald-200 overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-emerald-50 text-emerald-700 text-xs uppercase tracking-wide">
                  <tr>
                    <th class="text-left px-4 py-2.5 font-semibold">Day</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Period</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Class</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Teacher</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Subject</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Room</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-emerald-100 bg-white">
                  @for (e of result.added; track entryKey(e)) {
                    <tr class="hover:bg-emerald-50/40 transition-colors">
                      <td class="px-4 py-2.5 text-slate-700">{{ dayName(e.day_of_week) }}</td>
                      <td class="px-4 py-2.5 text-slate-700">{{ e.period_name }}</td>
                      <td class="px-4 py-2.5 text-slate-700">{{ e.year_group_name }}</td>
                      <td class="px-4 py-2.5 text-slate-700">{{ e.teacher_name }}</td>
                      <td class="px-4 py-2.5">
                        <span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{{ e.subject_code }}</span>
                        <span class="ml-1.5 text-slate-600">{{ e.subject_name }}</span>
                      </td>
                      <td class="px-4 py-2.5 text-slate-500">{{ e.room_name ?? '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        <!-- Removed -->
        @if (result.removed.length > 0) {
          <section class="mb-6">
            <h2 class="text-sm font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <mat-icon class="text-base">remove_circle_outline</mat-icon>
              Removed ({{ result.removed.length }})
            </h2>
            <div class="rounded-xl border border-red-200 overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-red-50 text-red-700 text-xs uppercase tracking-wide">
                  <tr>
                    <th class="text-left px-4 py-2.5 font-semibold">Day</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Period</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Class</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Teacher</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Subject</th>
                    <th class="text-left px-4 py-2.5 font-semibold">Room</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-red-100 bg-white">
                  @for (e of result.removed; track entryKey(e)) {
                    <tr class="hover:bg-red-50/40 transition-colors">
                      <td class="px-4 py-2.5 text-slate-700">{{ dayName(e.day_of_week) }}</td>
                      <td class="px-4 py-2.5 text-slate-700">{{ e.period_name }}</td>
                      <td class="px-4 py-2.5 text-slate-700">{{ e.year_group_name }}</td>
                      <td class="px-4 py-2.5 text-slate-700">{{ e.teacher_name }}</td>
                      <td class="px-4 py-2.5">
                        <span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{{ e.subject_code }}</span>
                        <span class="ml-1.5 text-slate-600">{{ e.subject_name }}</span>
                      </td>
                      <td class="px-4 py-2.5 text-slate-500">{{ e.room_name ?? '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        <!-- Modified -->
        @if (result.modified.length > 0) {
          <section class="mb-6">
            <h2 class="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <mat-icon class="text-base">edit_note</mat-icon>
              Modified ({{ result.modified.length }})
            </h2>
            <div class="space-y-2">
              @for (m of result.modified; track entryKey(m.before)) {
                <div class="rounded-xl border border-amber-200 overflow-hidden">
                  <!-- Coordinate header -->
                  <div class="bg-amber-50 px-4 py-2 flex items-center gap-4 text-xs font-semibold text-amber-700">
                    <span>{{ dayName(m.before.day_of_week) }}</span>
                    <span>{{ m.before.period_name }}</span>
                    <span>{{ m.before.year_group_name }}</span>
                    @if (m.changed_fields.length > 0) {
                      <span class="ml-auto text-[10px] bg-amber-200 text-amber-800 rounded px-1.5 py-0.5">
                        {{ m.changed_fields.join(', ') }} changed
                      </span>
                    }
                  </div>
                  <div class="grid grid-cols-2 divide-x divide-amber-100">
                    <!-- Before -->
                    <div class="p-4 bg-red-50/40">
                      <p class="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Before</p>
                      <dl class="space-y-1 text-xs text-slate-700">
                        <div class="flex gap-2">
                          <dt class="text-slate-400 w-16 shrink-0">Teacher</dt>
                          <dd [class.font-semibold]="m.changed_fields.includes('teacher')"
                              [class.text-red-700]="m.changed_fields.includes('teacher')">
                            {{ m.before.teacher_name }}
                          </dd>
                        </div>
                        <div class="flex gap-2">
                          <dt class="text-slate-400 w-16 shrink-0">Subject</dt>
                          <dd [class.font-semibold]="m.changed_fields.includes('subject')"
                              [class.text-red-700]="m.changed_fields.includes('subject')">
                            {{ m.before.subject_code }} {{ m.before.subject_name }}
                          </dd>
                        </div>
                        <div class="flex gap-2">
                          <dt class="text-slate-400 w-16 shrink-0">Room</dt>
                          <dd [class.font-semibold]="m.changed_fields.includes('room')"
                              [class.text-red-700]="m.changed_fields.includes('room')">
                            {{ m.before.room_name ?? '—' }}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <!-- After -->
                    <div class="p-4 bg-emerald-50/40">
                      <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">After</p>
                      <dl class="space-y-1 text-xs text-slate-700">
                        <div class="flex gap-2">
                          <dt class="text-slate-400 w-16 shrink-0">Teacher</dt>
                          <dd [class.font-semibold]="m.changed_fields.includes('teacher')"
                              [class.text-emerald-700]="m.changed_fields.includes('teacher')">
                            {{ m.after.teacher_name }}
                          </dd>
                        </div>
                        <div class="flex gap-2">
                          <dt class="text-slate-400 w-16 shrink-0">Subject</dt>
                          <dd [class.font-semibold]="m.changed_fields.includes('subject')"
                              [class.text-emerald-700]="m.changed_fields.includes('subject')">
                            {{ m.after.subject_code }} {{ m.after.subject_name }}
                          </dd>
                        </div>
                        <div class="flex gap-2">
                          <dt class="text-slate-400 w-16 shrink-0">Room</dt>
                          <dd [class.font-semibold]="m.changed_fields.includes('room')"
                              [class.text-emerald-700]="m.changed_fields.includes('room')">
                            {{ m.after.room_name ?? '—' }}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class VersionComparePage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(TimetableApiService);
  private state = inject(TimetableStateService);
  private destroy$ = new Subject<void>();

  protected versionAId = signal<number>(0);
  protected selectedWithId = signal<number | null>(null);

  protected versionA = computed<TimetableVersion | null>(() =>
    this.state.versions().find((v) => v.id === this.versionAId()) ?? null
  );
  protected versionB = computed<TimetableVersion | null>(() => {
    const id = this.selectedWithId();
    return id ? (this.state.versions().find((v) => v.id === id) ?? null) : null;
  });
  protected otherVersions = computed<TimetableVersion[]>(() =>
    this.state.versions().filter((v) => v.id !== this.versionAId())
  );

  protected compareResult = this.state.compareResult;
  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = Number(params.get('id'));
      this.versionAId.set(id);
      this.state.setCompareResult(null);
    });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const withId = Number(qp.get('with'));
      if (withId) {
        this.selectedWithId.set(withId);
        this.loadCompare(this.versionAId(), withId);
      }
    });

    if (this.state.versions().length === 0) {
      this.api.getVersions().subscribe({
        next: (list) => this.state.setVersions(list),
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onWithChange(withId: number): void {
    this.loadCompare(this.versionAId(), withId);
  }

  private loadCompare(aId: number, bId: number): void {
    if (!aId || !bId) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    this.state.setCompareResult(null);
    this.api.compareVersions(aId, bId).subscribe({
      next: (result) => {
        this.state.setCompareResult(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(`Comparison failed (${err.status})`);
        this.loading.set(false);
      },
    });
  }

  protected entryKey(e: CompareEntry): string {
    return `${e.day_of_week}-${e.tiered_period_id}-${e.year_group_id}-${e.teacher_id}-${e.subject_id}`;
  }

  protected dayName(d: number): string {
    return DAY_NAMES[d] ?? `Day ${d}`;
  }
}

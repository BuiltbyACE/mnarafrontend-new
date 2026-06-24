import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  TimetableApiService,
  TeacherOption,
  LiveLocatorResponse,
} from '@sms/domain/timetable';
import {
  StaffLocatorPanelComponent,
  LiveStatusBadgeComponent,
} from '@sms/frontend/timetable-matrix';

interface TeacherRow {
  teacher: TeacherOption;
  status: LiveLocatorResponse | null;
  loading: boolean;
}

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  IN_CLASS:           { label: 'In Class',          dot: 'bg-emerald-500' },
  AVAILABLE:          { label: 'Available',          dot: 'bg-blue-400' },
  INSTITUTIONAL_BLOCK:{ label: 'Institutional Block',dot: 'bg-amber-400' },
  RESTRICTED:         { label: 'Restricted',         dot: 'bg-slate-400' },
};

@Component({
  selector: 'app-staff-locator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    StaffLocatorPanelComponent,
    LiveStatusBadgeComponent,
  ],
  template: `
    <div class="p-6 max-w-[1400px] mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Staff Locator</h1>
          <p class="text-sm text-slate-500 mt-1">Live location of all teaching staff</p>
        </div>
        <button mat-stroked-button (click)="refreshAll()" [disabled]="refreshing()">
          <mat-icon fontSet="material-icons-outlined" class="text-base mr-1">refresh</mat-icon>
          {{ refreshing() ? 'Refreshing…' : 'Refresh All' }}
        </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <!-- All-staff grid (left 2/3) -->
        <div class="xl:col-span-2">
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">All Staff</h2>
              <span class="text-xs text-slate-400">{{ teachers().length }} teachers</span>
            </div>

            @if (loadingTeachers()) {
              <div class="p-8 space-y-3">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                    <div class="h-4 flex-1 bg-slate-100 rounded animate-pulse"></div>
                    <div class="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                }
              </div>
            } @else if (teachers().length === 0) {
              <div class="p-10 text-center text-slate-400">
                <mat-icon fontSet="material-icons-outlined" class="text-4xl">people_outline</mat-icon>
                <p class="text-sm mt-2">No teachers found</p>
              </div>
            } @else {
              <div class="divide-y divide-slate-50">
                @for (row of staffRows(); track row.teacher.id) {
                  <div class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                    <!-- Avatar initials -->
                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center
                                text-xs font-bold text-primary shrink-0 uppercase">
                      {{ initials(row.teacher.name) }}
                    </div>

                    <!-- Name -->
                    <span class="flex-1 text-sm font-medium text-slate-800 truncate">
                      {{ row.teacher.name }}
                    </span>

                    <!-- Status -->
                    @if (row.loading) {
                      <div class="h-3.5 w-20 bg-slate-100 rounded animate-pulse"></div>
                    } @else if (row.status) {
                      <div class="flex items-center gap-1.5 shrink-0">
                        <span class="w-2 h-2 rounded-full shrink-0 {{ statusDot(row.status.status) }}"></span>
                        <span class="text-xs text-slate-600">{{ statusLabel(row.status.status) }}</span>
                        @if (row.status.context?.room) {
                          <span class="text-xs text-slate-400">· {{ row.status.context!.room }}</span>
                        }
                      </div>
                    } @else {
                      <span class="text-xs text-slate-400 italic">—</span>
                    }

                    <!-- Live badge launcher -->
                    <button class="shrink-0 p-1 rounded hover:bg-slate-100 transition-colors"
                            (click)="pinTeacher(row.teacher)">
                      <mat-icon fontSet="material-icons-outlined" class="text-sm text-slate-400">
                        gps_fixed
                      </mat-icon>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Single-teacher lookup panel (right 1/3) -->
        <div class="xl:col-span-1">
          <app-staff-locator-panel [teachers]="teachers()" />
        </div>
      </div>
    </div>
  `,
  styles: [':host { display: block; min-height: 100vh; }'],
})
export class StaffLocatorPage implements OnInit, OnDestroy {
  private api = inject(TimetableApiService);

  protected teachers = signal<TeacherOption[]>([]);
  protected staffRows = signal<TeacherRow[]>([]);
  protected loadingTeachers = signal(false);
  protected refreshing = signal(false);

  private pollingHandle: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadingTeachers.set(true);
    this.api.getTeachers().subscribe({
      next: (list) => {
        this.teachers.set(list);
        this.staffRows.set(list.map((t) => ({ teacher: t, status: null, loading: true })));
        this.loadingTeachers.set(false);
        this.fetchAllStatuses();
        this.pollingHandle = setInterval(() => this.fetchAllStatuses(), 60_000);
      },
      error: () => {
        this.teachers.set([]);
        this.loadingTeachers.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.pollingHandle !== null) clearInterval(this.pollingHandle);
  }

  protected refreshAll(): void {
    this.refreshing.set(true);
    this.fetchAllStatuses(() => this.refreshing.set(false));
  }

  private fetchAllStatuses(onDone?: () => void): void {
    const list = this.teachers();
    if (list.length === 0) { onDone?.(); return; }

    let remaining = list.length;
    const done = () => { if (--remaining === 0) onDone?.(); };

    for (const teacher of list) {
      this.api.getTeacherStatus(teacher.id).subscribe({
        next: (status) => {
          this.staffRows.update((rows) =>
            rows.map((r) => r.teacher.id === teacher.id ? { ...r, status, loading: false } : r)
          );
          done();
        },
        error: () => {
          this.staffRows.update((rows) =>
            rows.map((r) => r.teacher.id === teacher.id ? { ...r, loading: false } : r)
          );
          done();
        },
      });
    }
  }

  protected pinTeacher(teacher: TeacherOption): void {
    // Scroll to + highlight in the locator panel (panel is self-contained; user can select from dropdown)
  }

  protected initials(name: string): string {
    return name.split(' ').slice(0, 2).map((p) => p[0]).join('');
  }

  protected statusLabel(status: string): string {
    return STATUS_LABEL[status]?.label ?? status;
  }

  protected statusDot(status: string): string {
    return STATUS_LABEL[status]?.dot ?? 'bg-slate-300';
  }
}

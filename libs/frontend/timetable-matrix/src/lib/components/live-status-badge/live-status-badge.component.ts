import { Component, input, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableApiService, LiveLocatorResponse } from '@sms/domain/timetable';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-live-status-badge',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @keyframes pulse-ring {
      0%   { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2);   opacity: 0; }
    }
    .pulse-ring {
      animation: pulse-ring 1.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
  `],
  template: `
    @if (status(); as s) {
      <div class="flex items-center gap-3 p-3 rounded-lg border transition-colors duration-300"
           [class.border-emerald-800]="s.status === 'IN_CLASS'"
           [class.bg-emerald-950/40]="s.status === 'IN_CLASS'"
           [class.border-slate-700]="s.status === 'AVAILABLE'"
           [class.bg-slate-900]="s.status === 'AVAILABLE'"
           [class.border-indigo-800]="s.status === 'INSTITUTIONAL_BLOCK'"
           [class.bg-indigo-950/30]="s.status === 'INSTITUTIONAL_BLOCK'"
           [class.border-red-900/50]="s.status === 'RESTRICTED'"
           [class.bg-red-950/20]="s.status === 'RESTRICTED'">

        <!-- Status Indicator -->
        <div class="relative flex-shrink-0">
          @if (s.status === 'IN_CLASS') {
            <div class="relative h-3 w-3">
              <div class="pulse-ring absolute inset-0 rounded-full bg-emerald-500 opacity-75"></div>
              <div class="relative h-3 w-3 rounded-full bg-emerald-400"></div>
            </div>
          } @else if (s.status === 'AVAILABLE') {
            <div class="h-3 w-3 rounded-full bg-slate-500"></div>
          } @else if (s.status === 'INSTITUTIONAL_BLOCK') {
            <div class="h-3 w-3 rounded-full bg-indigo-400"></div>
          } @else {
            <div class="h-3 w-3 rounded-full bg-red-400"></div>
          }
        </div>

        <!-- Status Text -->
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold uppercase tracking-wide"
               [class.text-emerald-400]="s.status === 'IN_CLASS'"
               [class.text-slate-400]="s.status === 'AVAILABLE'"
               [class.text-indigo-400]="s.status === 'INSTITUTIONAL_BLOCK'"
               [class.text-red-400]="s.status === 'RESTRICTED'">
            {{ statusLabel(s) }}
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5 truncate">{{ s.location }}</div>
          @if (s.context?.subject) {
            <div class="text-[10px] text-slate-600 mt-0.5">
              {{ s.context!.subject }} · {{ s.context!.year_group }}
              @if (s.context!.ends_at) {
                · until {{ s.context!.ends_at }}
              }
            </div>
          }
        </div>

        @if (s.status === 'IN_CLASS') {
          <span class="text-[9px] text-emerald-600 font-semibold uppercase tracking-widest flex-shrink-0">Live</span>
        }
      </div>
    } @else {
      <div class="h-16 rounded-lg bg-slate-800 animate-pulse"></div>
    }
  `,
})
export class LiveStatusBadgeComponent implements OnInit, OnDestroy {
  readonly teacherId = input.required<number>();
  readonly pollingIntervalMs = input(30_000);

  protected status = signal<LiveLocatorResponse | null>(null);
  private api = inject(TimetableApiService);
  private sub: Subscription | null = null;

  ngOnInit(): void {
    this.api.getTeacherStatus(this.teacherId()).subscribe({
      next: (s) => this.status.set(s),
    });

    this.sub = interval(this.pollingIntervalMs())
      .pipe(switchMap(() => this.api.getTeacherStatus(this.teacherId())))
      .subscribe({
        next: (s) => this.status.set(s),
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  protected statusLabel(s: LiveLocatorResponse): string {
    switch (s.status) {
      case 'IN_CLASS':           return 'In Class';
      case 'AVAILABLE':          return 'Available';
      case 'INSTITUTIONAL_BLOCK': return 'Assembly / Prayer';
      case 'RESTRICTED':         return 'Restricted';
      default:                   return '—';
    }
  }
}

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { VersionStatus } from '@sms/domain/timetable';

const STATUS_CONFIG: Record<VersionStatus, { label: string; bg: string; text: string; border: string; dot: string; extra?: string }> = {
  DRAFT:        { label: 'Draft',        bg: 'bg-slate-100',    text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50',     text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  PUBLISHED:    { label: 'Published',    bg: 'bg-emerald-50',   text: 'text-emerald-700',border: 'border-emerald-200', dot: 'bg-emerald-500' },
  ARCHIVED:     { label: 'Archived',     bg: 'bg-slate-50',     text: 'text-slate-400',  border: 'border-slate-200',  dot: 'bg-slate-300', extra: 'line-through' },
};

@Component({
  selector: 'app-version-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg border"
          [class]="cfg().bg + ' ' + cfg().text + ' ' + cfg().border + (cfg().extra ? ' ' + cfg().extra : '')">
      <span class="w-1.5 h-1.5 rounded-full" [class]="cfg().dot"></span>
      {{ cfg().label }}
    </span>
  `,
})
export class VersionStatusBadgeComponent {
  readonly status = input.required<VersionStatus>();
  protected readonly cfg = computed(() => STATUS_CONFIG[this.status()]);
}

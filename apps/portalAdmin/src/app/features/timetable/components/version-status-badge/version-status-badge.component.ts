import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { VersionStatus } from '@sms/domain/timetable';

const STATUS_CONFIG: Record<VersionStatus, { label: string; bg: string; text: string; border: string; extra?: string }> = {
  DRAFT:        { label: 'Draft',        bg: 'bg-slate-100',    text: 'text-slate-600',  border: 'border-slate-200' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50',     text: 'text-amber-700',  border: 'border-amber-200' },
  PUBLISHED:    { label: 'Published',    bg: 'bg-emerald-50',   text: 'text-emerald-700',border: 'border-emerald-200' },
  ARCHIVED:     { label: 'Archived',     bg: 'bg-slate-50',     text: 'text-slate-400',  border: 'border-slate-200', extra: 'line-through' },
};

@Component({
  selector: 'app-version-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border"
          [class]="cfg().bg + ' ' + cfg().text + ' ' + cfg().border + (cfg().extra ? ' ' + cfg().extra : '')">
      {{ cfg().label }}
    </span>
  `,
})
export class VersionStatusBadgeComponent {
  readonly status = input.required<VersionStatus>();
  protected readonly cfg = computed(() => STATUS_CONFIG[this.status()]);
}

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableEntry, BellSchedulePeriod, TeachingRequirement } from '@sms/domain/scheduling';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Component({
  selector: 'sched-inspector-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inspector-panel">
      <div class="panel-header">
        <h3 class="panel-title">Inspector</h3>
      </div>

      @if (selectedEntry) {
        <div class="inspector-content">
          <div class="detail-card">
            <div class="detail-subject">
              <span class="subject-badge">{{ selectedEntry.subject_name }}</span>
            </div>

            <div class="detail-rows">
              <div class="detail-row">
                <span class="label">Teacher</span>
                <span class="value">Teacher #{{ selectedEntry.teacher_id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Year Level</span>
                <span class="value">Year {{ selectedEntry.year_level }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Period</span>
                <span class="value">{{ selectedPeriodLabel() }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Day</span>
                <span class="value">{{ dayName() }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Classroom</span>
                <span class="value">{{ selectedEntry.classroom_name || 'Not assigned' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Course</span>
                <span class="value value-mono">CW-{{ selectedEntry.course_workspace }}</span>
              </div>
            </div>

            <div class="detail-actions">
              <button class="action-btn danger" (click)="deleteEntry.emit(selectedEntry.id)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M3 4l1 8h6l1-8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Remove
              </button>
            </div>
          </div>

          @if (teachingRequirement()) {
            <div class="requirement-card">
              <div class="req-title">Requirement Progress</div>
              <div class="req-bar">
                <div
                  class="req-fill"
                  [style.width.%]="reqPercent()">
                </div>
              </div>
              <div class="req-text">
                {{ selectedEntry.subject_name }}: {{ teachingRequirement()!.scheduled_count }} / {{ teachingRequirement()!.required_periods_per_week }} periods
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-inspector">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p>Select a lesson to inspect</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .inspector-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .panel-header { padding: 16px 16px 12px; border-bottom: 1px solid var(--tt-border, #e9eef4); }
    .panel-title { font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--tt-text, #0b1a2e); }
    .inspector-content { flex: 1; overflow-y: auto; padding: 12px; }
    .detail-card { background: var(--tt-surface, #ffffff); border: 1px solid var(--tt-border, #e9eef4); border-radius: var(--tt-radius-card, 16px); padding: 16px; }
    .detail-subject { margin-bottom: 14px; }
    .subject-badge { display: inline-block; font-size: 0.875rem; font-weight: 700; color: var(--tt-primary, #1a2a6c); background: var(--tt-primary-bg, #e8edfb); padding: 4px 12px; border-radius: 8px; }
    .detail-rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .detail-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--tt-border-medium, #edf2f7); }
    .label { font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
    .value { font-size: 0.8125rem; color: var(--tt-text, #0b1a2e); font-weight: 500; }
    .value-mono { font-family: monospace; font-size: 0.75rem; }
    .detail-actions { display: flex; gap: 6px; }
    .action-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 0.75rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: all 0.15s ease; }
    .action-btn.danger { background: var(--tt-danger-bg, #fee2e2); color: var(--tt-danger-text, #dc2626); }
    .action-btn.danger:hover { background: var(--tt-danger-text, #dc2626); color: white; }
    .requirement-card { margin-top: 10px; background: var(--tt-surface-alt, #f8faff); border: 1px solid var(--tt-border, #e9eef4); border-radius: var(--tt-radius-icon, 12px); padding: 12px; }
    .req-title { font-size: 0.6875rem; font-weight: 600; color: var(--tt-text-muted, #5e6f8d); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
    .req-bar { height: 4px; background: var(--tt-border, #e9eef4); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
    .req-fill { height: 100%; background: var(--tt-primary, #1a2a6c); border-radius: 2px; transition: width 0.3s ease; }
    .req-text { font-size: 0.75rem; color: var(--tt-text-body, #5e6f8d); }
    .empty-inspector { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 48px 16px; color: var(--tt-text-faint, #64748b); }
    .empty-inspector p { font-size: 0.8125rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorPanelComponent {
  @Input() selectedEntry: TimetableEntry | null = null;
  @Input() periods: BellSchedulePeriod[] = [];
  @Input() requirements: TeachingRequirement[] = [];
  @Output() deleteEntry = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();

  readonly selectedPeriodLabel = computed(() => {
    if (!this.selectedEntry) return '';
    const period = this.periods.find(p => p.id === this.selectedEntry!.bell_schedule_period);
    if (!period) return `Period #${this.selectedEntry.bell_schedule_period}`;
    return `${period.label || `Period`}: ${period.start_time.slice(0, 5)} - ${period.end_time.slice(0, 5)}`;
  });

  readonly dayName = computed(() => {
    if (!this.selectedEntry) return '';
    return DAY_NAMES[this.selectedEntry.day_of_week] ?? `Day ${this.selectedEntry.day_of_week}`;
  });

  readonly teachingRequirement = computed(() => {
    if (!this.selectedEntry) return null;
    const entry = this.selectedEntry!;
    return this.requirements.find(r => r.subject_offering === entry.subject_offering_id) ?? null;
  });

  readonly reqPercent = computed(() => {
    const req = this.teachingRequirement();
    if (!req) return 0;
    return Math.min(100, (req.scheduled_count / req.required_periods_per_week) * 100);
  });
}

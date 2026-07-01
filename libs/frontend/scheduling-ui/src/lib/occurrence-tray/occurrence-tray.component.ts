import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
  computed, signal, ElementRef, AfterViewInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeachingRequirement } from '@sms/domain/scheduling';
import { Draggable } from '@fullcalendar/interaction';

@Component({
  selector: 'sched-occurrence-tray',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="occurrence-tray">
      <div class="tray-header">
        <h3 class="tray-title">Teaching Requirements</h3>
        <span class="tray-count">{{ incompleteCount() }} remaining</span>
      </div>

      <div class="requirements-list" #trayList>
        @for (req of sortedRequirements(); track req.id) {
          <div
            class="requirement-card"
            [class.completed]="isCompleted(req)"
            [class.draggable]="!isCompleted(req)"
            [attr.data-requirement-id]="req.id">
            <div class="req-header">
              <span class="req-subject">{{ req.subject_name }}</span>
              <span class="req-level">{{ req.year_level_name }}</span>
            </div>
            <div class="req-progress">
              <div class="progress-track">
                <div
                  class="progress-fill"
                  [style.width.%]="progressPercent(req)"
                  [class.full]="isCompleted(req)">
                </div>
              </div>
              <span class="progress-text" [class.done]="isCompleted(req)">
                {{ req.scheduled_count }} / {{ req.required_periods_per_week }}
              </span>
            </div>
            @if (isCompleted(req)) {
              <div class="check-mark">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <p>No requirements loaded</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .occurrence-tray { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .tray-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 12px; border-bottom: 1px solid var(--tt-border, #e9eef4); }
    .tray-title { font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--tt-text, #0b1a2e); }
    .tray-count { font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); background: var(--tt-surface-alt, #f8faff); padding: 2px 8px; border-radius: 10px; }
    .requirements-list { flex: 1; overflow-y: auto; padding: 8px 12px; }
    .requirement-card { position: relative; padding: 10px 12px; margin-bottom: 6px; border-radius: var(--tt-radius-icon, 12px); transition: all 0.15s ease; cursor: default; }
    .requirement-card.draggable { background: var(--tt-surface, #ffffff); border: 1px solid var(--tt-border, #e9eef4); cursor: grab; }
    .requirement-card.draggable:hover { border-color: var(--tt-primary-light, #2d4373); box-shadow: 0 2px 8px rgba(26, 42, 108, 0.08); transform: translateY(-1px); }
    .requirement-card.draggable:active { cursor: grabbing; }
    .requirement-card.completed { background: #f0fdf4; border: 1px solid #bbf7d0; opacity: 0.7; }
    .req-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .req-subject { font-size: 0.8125rem; font-weight: 600; color: var(--tt-text, #0b1a2e); }
    .req-level { font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); background: var(--tt-surface-subtle, #f1f4f9); padding: 1px 6px; border-radius: 6px; }
    .req-progress { display: flex; align-items: center; gap: 8px; }
    .progress-track { flex: 1; height: 4px; background: var(--tt-border, #e9eef4); border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--tt-primary, #1a2a6c); border-radius: 2px; transition: width 0.3s ease; }
    .progress-fill.full { background: #22c55e; }
    .progress-text { font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); white-space: nowrap; min-width: 36px; text-align: right; }
    .progress-text.done { color: #22c55e; font-weight: 600; }
    .check-mark { position: absolute; top: 8px; right: 8px; color: #22c55e; }
    .empty-state { padding: 24px 16px; text-align: center; color: var(--tt-text-faint, #64748b); font-size: 0.8125rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OccurrenceTrayComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) requirements: TeachingRequirement[] = [];

  private draggable: Draggable | null = null;

  readonly incompleteCount = computed(() =>
    this.requirements.filter(r => r.scheduled_count < r.required_periods_per_week).length,
  );

  readonly sortedRequirements = computed(() =>
    [...this.requirements].sort((a, b) => {
      const aDone = a.scheduled_count >= a.required_periods_per_week ? 1 : 0;
      const bDone = b.scheduled_count >= b.required_periods_per_week ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return a.subject_name.localeCompare(b.subject_name);
    }),
  );

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.initDraggable();
  }

  ngOnDestroy(): void {
    this.draggable?.destroy();
  }

  private initDraggable(): void {
    const el = this.el.nativeElement.querySelector('.requirements-list');
    if (!el) return;

    this.draggable = new Draggable(el as HTMLElement, {
      itemSelector: '.requirement-card.draggable',
      eventData: (eventEl: HTMLElement) => {
        const idStr = eventEl.getAttribute('data-requirement-id');
        if (!idStr) return {};
        const id = Number(idStr);
        const req = this.requirements.find(r => r.id === id);
        if (!req) return {};
        return {
          title: `${req.subject_name} - ${req.year_level_name}`,
          extendedProps: {
            requirementId: req.id,
            subjectName: req.subject_name,
            yearLevelName: req.year_level_name,
            subjectOffering: req.subject_offering,
          },
        };
      },
    });
  }

  isCompleted(req: TeachingRequirement): boolean {
    return req.scheduled_count >= req.required_periods_per_week;
  }

  progressPercent(req: TeachingRequirement): number {
    return Math.min(100, (req.scheduled_count / req.required_periods_per_week) * 100);
  }
}

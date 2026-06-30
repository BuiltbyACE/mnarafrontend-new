import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TeachingRequirement } from '@sms/domain/scheduling';

@Component({
  selector: 'sched-occurrence-tray',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="occurrence-tray p-4 border-r border-slate-200">
      <h3 class="text-sm font-semibold text-slate-700 mb-3">
        Required Periods
      </h3>
      <div
        *ngFor="let req of requirements"
        class="occurrence-chip px-3 py-2 mb-2 rounded-md bg-blue-50 border border-blue-200 text-sm cursor-move"
        cdkDrag
        [cdkDragData]="req">
        <span class="font-medium">{{ req.subject_name }}</span>
        <span class="text-xs text-slate-500 ml-2">
          {{ req.scheduled_count }}/{{ req.required_periods_per_week }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .occurrence-tray { min-width: 220px; overflow-y: auto; }
    .occurrence-chip:hover { background: #eff6ff; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OccurrenceTrayComponent {
  @Input() requirements: TeachingRequirement[] = [];
}

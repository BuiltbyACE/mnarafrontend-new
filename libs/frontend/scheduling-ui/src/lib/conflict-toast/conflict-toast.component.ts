import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConflictError } from '@sms/domain/scheduling';

@Component({
  selector: 'sched-conflict-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="errors.length"
      class="fixed bottom-4 right-4 max-w-sm bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50">
      <h4 class="text-sm font-semibold text-red-800 mb-1">Schedule Conflict</h4>
      <ul class="text-xs text-red-700 space-y-1">
        <li *ngFor="let err of errors">
          <span class="font-mono text-[10px] uppercase tracking-wider bg-red-100 px-1 rounded">{{ err.rule }}</span>
          {{ err.message }}
        </li>
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictToastComponent {
  @Input() errors: ConflictError[] = [];
}

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConflictError } from '@sms/domain/scheduling';

@Component({
  selector: 'sched-conflict-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="conflict-panel">
      <div class="panel-header">
        <h3 class="panel-title">Conflicts</h3>
        @if (errors.length > 0) {
          <span class="badge danger">{{ errors.length }}</span>
        }
      </div>

      <div class="conflict-list">
        @for (err of errors; track err.code + '-' + $index) {
          <div
            class="conflict-item"
            [class.can-focus]="hasEntryRef(err)"
            (click)="focusEntry(err)">
            <div class="conflict-rule">
              <span class="rule-badge" [class]="'rule-' + err.rule.toLowerCase()">{{ err.rule }}</span>
              <span class="conflict-code">{{ err.code | titlecase }}</span>
            </div>
            <p class="conflict-message">{{ err.message }}</p>
            @if (err.context?.['clashing_entry_id']) {
              <button
                class="focus-btn"
                (click)="$event.stopPropagation(); focusEntry(err)">
                Focus
              </button>
            }
          </div>
        } @empty {
          <div class="no-conflicts">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>No conflicts detected</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .conflict-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 12px; border-bottom: 1px solid var(--tt-border, #e9eef4); }
    .panel-title { font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--tt-text, #0b1a2e); }
    .badge { font-size: 0.6875rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .badge.danger { background: var(--tt-danger-bg, #fee2e2); color: var(--tt-danger-text, #dc2626); }
    .conflict-list { flex: 1; overflow-y: auto; padding: 8px 12px; }
    .conflict-item { padding: 10px 12px; margin-bottom: 6px; border-radius: var(--tt-radius-icon, 12px); background: var(--tt-danger-bg, #fee2e2); border: 1px solid #fecaca; transition: all 0.15s ease; }
    .conflict-item.can-focus { cursor: pointer; }
    .conflict-item.can-focus:hover { border-color: var(--tt-danger-text, #dc2626); box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1); }
    .conflict-rule { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .rule-badge { font-size: 0.625rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; font-family: monospace; }
    .rule-r1 { background: #fecaca; color: #dc2626; }
    .rule-r2 { background: #fed7aa; color: #ea580c; }
    .rule-r3 { background: #fef08a; color: #a16207; }
    .rule-r4 { background: #bfdbfe; color: #2563eb; }
    .rule-r5 { background: #c7d2fe; color: #4f46e5; }
    .conflict-code { font-size: 0.6875rem; color: #991b1b; font-weight: 600; }
    .conflict-message { font-size: 0.75rem; color: #7f1d1d; line-height: 1.4; }
    .focus-btn { margin-top: 4px; font-size: 0.6875rem; color: var(--tt-primary, #1a2a6c); background: transparent; border: 1px solid var(--tt-primary, #1a2a6c); border-radius: 6px; padding: 2px 8px; cursor: pointer; transition: all 0.15s ease; }
    .focus-btn:hover { background: var(--tt-primary, #1a2a6c); color: white; }
    .no-conflicts { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 32px 16px; color: var(--tt-text-faint, #64748b); }
    .no-conflicts p { font-size: 0.8125rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictPanelComponent {
  @Input({ required: true }) errors: ConflictError[] = [];
  @Output() focusEntryId = new EventEmitter<number>();

  hasEntryRef(err: ConflictError): boolean {
    return !!err.context?.['clashing_entry_id'];
  }

  focusEntry(err: ConflictError): void {
    const entryId = err.context?.['clashing_entry_id'] as number | undefined;
    if (entryId) this.focusEntryId.emit(entryId);
  }
}

import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveTrackerService } from '../services/live-tracker.service';
import { LiveStatusBadgeComponent } from '../live-status-badge/live-status-badge.component';

@Component({
  selector: 'sched-staff-locator-panel',
  standalone: true,
  imports: [CommonModule, LiveStatusBadgeComponent],
  template: `
    <div class="locator-panel">
      <div class="panel-header">
        <h3 class="panel-title">Staff Locations</h3>
        <div class="header-status">
          <span class="count-badge in-class" title="In class">{{ tracker.inClassCount() }}</span>
          <span class="count-badge available" title="Available">{{ tracker.availableCount() }}</span>
          <button class="refresh-btn" (click)="refresh()" [disabled]="loading()">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" [class.spinning]="loading()">
              <path d="M1 6a5 5 0 0110 0M11 6a5 5 0 01-10 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              <path d="M8 3.5h2.5V1M4 8.5H1.5V11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="staff-list">
        @for (staff of tracker.locations(); track staff.teacherId) {
          <div class="staff-card" [class]="'card-' + staff.status.toLowerCase()">
            <div class="staff-primary">
              <span class="staff-name">{{ staff.teacherName }}</span>
              <sched-live-status-badge [status]="staff.status" />
            </div>
            <div class="staff-details">
              <span class="staff-location">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1a3 3 0 00-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 00-3-3z" stroke="currentColor" stroke-width="1.2"/>
                  <circle cx="5" cy="4" r="1" fill="currentColor"/>
                </svg>
                {{ staff.location }}
              </span>
              @if (staff.context) {
                <span class="staff-context">{{ staff.context }}</span>
              }
            </div>
            <div class="staff-time">
              {{ staff.lastUpdated | date:'HH:mm' }}
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p>No staff location data</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .locator-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--tt-border, #e9eef4); }
    .panel-title { font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--tt-text, #0b1a2e); }
    .header-status { display: flex; align-items: center; gap: 6px; }
    .count-badge { font-size: 0.6875rem; font-weight: 700; padding: 1px 7px; border-radius: 10px; min-width: 20px; text-align: center; }
    .count-badge.in-class { background: #dcfce7; color: #15803d; }
    .count-badge.available { background: #f1f5f9; color: #475569; }
    .refresh-btn { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 1px solid var(--tt-border, #e9eef4); border-radius: 6px; background: transparent; color: var(--tt-text-muted, #5e6f8d); cursor: pointer; transition: all 0.15s ease; }
    .refresh-btn:hover { border-color: var(--tt-primary-light, #2d4373); color: var(--tt-primary, #1a2a6c); }
    .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinning { animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .staff-list { flex: 1; overflow-y: auto; padding: 8px; }
    .staff-card { padding: 10px 12px; margin-bottom: 6px; border: 1px solid var(--tt-border, #e9eef4); border-radius: var(--tt-radius-icon, 12px); transition: all 0.15s ease; }
    .staff-card.card-in_class { border-left: 3px solid #22c55e; background: #fafdfb; }
    .staff-card.card-available { border-left: 3px solid #94a3b8; background: #fafbfc; }
    .staff-card.card-institutional_block { border-left: 3px solid #8b5cf6; background: #faf5ff; }
    .staff-card.card-restricted { border-left: 3px solid #f59e0b; background: #fffbeb; }
    .staff-primary { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .staff-name { font-size: 0.8125rem; font-weight: 600; color: var(--tt-text, #0b1a2e); }
    .staff-details { display: flex; flex-direction: column; gap: 1px; }
    .staff-location { display: flex; align-items: center; gap: 4px; font-size: 0.6875rem; color: var(--tt-text-muted, #5e6f8d); }
    .staff-context { font-size: 0.6875rem; color: var(--tt-text-faint, #64748b); padding-left: 14px; }
    .staff-time { font-size: 0.625rem; color: var(--tt-text-faint, #64748b); text-align: right; margin-top: 2px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: var(--tt-text-faint, #64748b); }
    .empty-state p { font-size: 0.8125rem; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffLocatorPanelComponent implements OnInit {
  readonly tracker = inject(LiveTrackerService);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.tracker.locateAll().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }
}

import { Component, input, output, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransportService } from '../../services/transport.service';
import type { DailyTrip, TripManifest } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-manifest-drawer',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatDividerModule, MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="drawer-overlay" [class.open]="isOpen()" (click)="closeDrawer()" role="presentation">
      <div class="drawer-panel" [class.open]="isOpen()" (click)="$event.stopPropagation()" (keydown)="$event.key === 'Escape' && closeDrawerEvent.emit()" role="dialog" aria-modal="true" tabindex="-1">
        <div class="drawer-header">
          <div class="drawer-title-section">
            <h2>Passenger Manifest</h2>
            @if (trip(); as t) {
              <span class="drawer-subtitle">{{ t.vehicle_details?.registration_number }} — {{ t.route_name }}</span>
            }
          </div>
          <button mat-icon-button (click)="closeDrawer()" (keydown)="$event.key === 'Enter' && closeDrawer()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <mat-divider></mat-divider>

        @if (loading()) {
          <div class="loading-state">
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            <p>Loading passenger data...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error() }}</p>
          </div>
        } @else {
          <div class="manifest-stats">
            <div class="stat-item">
              <span class="stat-value">{{ boardedCount() }}</span>
              <span class="stat-label">Boarded</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ alightedCount() }}</span>
              <span class="stat-label">Alighted</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ pendingCount() }}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>

          @if (searchQuery()) {
            <div class="search-results-info">
              Found {{ filteredManifests().length }} of {{ manifests().length }} passengers
            </div>
          }

          <div class="manifest-list">
            @for (entry of filteredManifests(); track entry.id) {
              <div class="manifest-item" [class.boarded]="entry.boarded" [class.alighted]="entry.alighted">
                <div class="manifest-indicator">
                  @if (entry.boarded && entry.alighted) {
                    <mat-icon class="indicator-icon completed" matTooltip="Completed trip">check_circle</mat-icon>
                  } @else if (entry.boarded) {
                    <mat-icon class="indicator-icon boarded" matTooltip="On board">directions_bus</mat-icon>
                  } @else {
                    <mat-icon class="indicator-icon pending" matTooltip="Not yet boarded">schedule</mat-icon>
                  }
                </div>
                <div class="manifest-body">
                  <div class="manifest-primary">
                    <span class="student-id">{{ entry.student_school_id || 'STU-' + entry.student.toString().padStart(3, '0') }}</span>
                    <span class="student-name">{{ entry.student_name || 'Unknown' }}</span>
                  </div>
                  <div class="manifest-secondary">
                    <span class="stop-name">
                      <mat-icon>location_on</mat-icon> {{ entry.stop_name || 'Unknown stop' }}
                    </span>
                  </div>
                  <div class="manifest-tertiary">
                    @if (entry.timestamp) {
                      <span class="ping-time">
                        <mat-icon>access_time</mat-icon> Last ping: {{ entry.timestamp | date:'short' }}
                      </span>
                    }
                    <div class="status-chips">
                      @if (entry.boarded) {
                        <mat-chip class="chip-boarded" selected>Boarded</mat-chip>
                      }
                      @if (entry.alighted) {
                        <mat-chip class="chip-alighted" selected>Alighted</mat-chip>
                      }
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-manifest">
                <mat-icon>groups_off</mat-icon>
                <p>No passengers on this trip</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; }
    .drawer-overlay.open { opacity: 1; pointer-events: auto; }
    .drawer-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 460px; max-width: 100vw; background: white; z-index: 1001; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,0.12); }
    .drawer-panel.open { transform: translateX(0); }
    .drawer-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px; }
    .drawer-title-section h2 { margin: 0; font-size: 1.25rem; font-weight: 600; color: #1e293b; }
    .drawer-subtitle { font-size: 0.8rem; color: #64748b; margin-top: 2px; display: block; }
    .loading-state { padding: 48px 24px; text-align: center; color: #94a3b8; }
    .loading-state p { margin: 12px 0 0; font-size: 0.875rem; }
    .error-state { padding: 48px 24px; text-align: center; color: #dc2626; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .error-state mat-icon { font-size: 36px; width: 36px; height: 36px; }

    .manifest-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 16px 24px; }
    .stat-item { text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .stat-value { display: block; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 600; }

    .search-results-info { padding: 4px 24px 0; font-size: 0.75rem; color: #94a3b8; }

    .manifest-list { flex: 1; overflow-y: auto; padding: 8px 24px 24px; display: flex; flex-direction: column; gap: 4px; }
    .manifest-item { display: flex; gap: 12px; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; transition: all 0.15s; }
    .manifest-item:hover { background: #f8fafc; }
    .manifest-item.boarded { border-left: 3px solid #10b981; }
    .manifest-item.alighted { border-left: 3px solid #3b82f6; background: #f8fafc; }
    .manifest-indicator { flex-shrink: 0; }
    .indicator-icon { font-size: 22px; width: 22px; height: 22px; }
    .indicator-icon.completed { color: #3b82f6; }
    .indicator-icon.boarded { color: #10b981; }
    .indicator-icon.pending { color: #94a3b8; }
    .manifest-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .manifest-primary { display: flex; align-items: baseline; gap: 8px; }
    .student-id { font-size: 0.8rem; font-weight: 700; color: #1e293b; font-family: monospace; }
    .student-name { font-size: 0.75rem; color: #64748b; }
    .manifest-secondary { display: flex; align-items: center; gap: 4px; }
    .stop-name { font-size: 0.7rem; color: #475569; display: flex; align-items: center; gap: 2px; }
    .stop-name mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .manifest-tertiary { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .ping-time { font-size: 0.65rem; color: #94a3b8; display: flex; align-items: center; gap: 2px; }
    .ping-time mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .status-chips { display: flex; gap: 4px; }
    .chip-boarded { background: #dcfce7 !important; color: #059669 !important; font-size: 0.6rem !important; height: 22px !important; }
    .chip-alighted { background: #dbeafe !important; color: #2563eb !important; font-size: 0.6rem !important; height: 22px !important; }
    .empty-manifest { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 24px; color: #94a3b8; }
    .empty-manifest mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.5; }
    .empty-manifest p { margin: 0; font-size: 0.875rem; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  `],
})
export class ManifestDrawerComponent {
  private transportService = inject(TransportService);

  readonly trip = input<DailyTrip | null>(null);
  readonly isOpen = input<boolean>(false);
  readonly closeDrawerEvent = output<void>();

  readonly manifests = signal<TripManifest[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');

  readonly boardedCount = computed(() => this.manifests().filter(m => m.boarded).length);
  readonly alightedCount = computed(() => this.manifests().filter(m => m.alighted).length);
  readonly pendingCount = computed(() => this.manifests().filter(m => !m.boarded).length);

  readonly filteredManifests = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.manifests();
    return this.manifests().filter(m =>
      (m.student_school_id?.toLowerCase() || '').includes(q) ||
      (m.student_name?.toLowerCase() || '').includes(q) ||
      (m.stop_name?.toLowerCase() || '').includes(q)
    );
  });

  private currentTripId = '';

  constructor() {
    effect(() => {
      const trip = this.trip();
      const open = this.isOpen();
      if (trip && open && trip.id !== this.currentTripId) {
        this.currentTripId = trip.id;
        this.loadManifests(trip.id);
      }
      if (!open) {
        this.currentTripId = '';
      }
    });
  }

  private loadManifests(tripId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.transportService.getManifests(tripId).subscribe({
      next: (data) => {
        this.manifests.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load manifests');
        this.loading.set(false);
      },
    });
  }

  closeDrawer(): void {
    this.closeDrawerEvent.emit();
  }
}

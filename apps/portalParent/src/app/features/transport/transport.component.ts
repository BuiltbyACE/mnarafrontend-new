import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../services/parent-api.service';
import { Trip, Manifest, TransportRoute, FleetTelemetry } from '../../models/parent.models';
import { ParentFleetMapComponent } from './parent-fleet-map.component';

@Component({
  selector: 'app-transport',
  imports: [MatCardModule, MatIconModule, MatTabsModule, MatProgressSpinnerModule, DatePipe, ParentFleetMapComponent],
  template: `
    <div class="tr-page">
      <header class="tr-header">
        <mat-icon class="tr-header-icon">directions_bus</mat-icon>
        <div class="tr-header-text">
          <h1 class="tr-header-title">Transport</h1>
          <p class="tr-header-sub">Live fleet tracking, trips, and manifests</p>
        </div>
      </header>

      <div class="tr-content">
        @if (loading()) {
          <div class="tr-loading">
            <mat-spinner diameter="36"></mat-spinner>
            <span>Loading transport data…</span>
          </div>
        } @else if (error()) {
          <div class="tr-error">{{ error() }}</div>
        } @else {
          <mat-tab-group animationDuration="200ms">
            <mat-tab label="Live Map">
              <div class="tr-map-panel">
                <app-parent-fleet-map
                  [telemetryData]="telemetry()"
                  [routesData]="routes()"
                  [showReconnecting]="false"
                  style="display:block;width:100%;height:100%;"
                />
              </div>
            </mat-tab>
            <mat-tab label="Trips ({{ trips().length }})">
              @if (trips().length > 0) {
                <div class="tr-list">
                  @for (t of trips(); track t.id) {
                    <div class="tr-item">
                      <mat-icon>directions_bus</mat-icon>
                      <div class="tr-item-body">
                        <span class="tr-item-title">{{ t.route_name }}</span>
                        <span class="tr-item-sub">Driver: {{ t.driver_name }}</span>
                      </div>
                      <div class="tr-item-right">
                        <span class="tr-item-time">{{ t.departure_time }}</span>
                        <span class="tr-item-date">{{ t.date | date:'shortDate' }}</span>
                      </div>
                    </div>
                  }
                </div>
              } @else { <div class="tr-no-data">No trips assigned</div> }
            </mat-tab>
            <mat-tab label="Manifests ({{ manifests().length }})">
              @if (manifests().length > 0) {
                <div class="tr-list">
                  @for (m of manifests(); track m.id) {
                    <div class="tr-item">
                      <mat-icon>pin_drop</mat-icon>
                      <div class="tr-item-body">
                        <span class="tr-item-title">{{ m.student_name }}</span>
                        <span class="tr-item-sub">Stop: {{ m.stop_name }}</span>
                      </div>
                      <span class="tr-item-date">{{ m.trip_date | date:'shortDate' }}</span>
                    </div>
                  }
                </div>
              } @else { <div class="tr-no-data">No manifest entries</div> }
            </mat-tab>
          </mat-tab-group>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tr-page { max-width: 1200px; margin: 0 auto; }
    .tr-header { display: flex; align-items: center; gap: 16px; padding: 24px; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); border-radius: 16px; margin-bottom: 24px; }
    .tr-header-icon { font-size: 48px; width: 48px; height: 48px; color: white; opacity: 0.9; }
    .tr-header-text { flex: 1; display: flex; flex-direction: column; }
    .tr-header-title { font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: 700; color: white; margin: 0; }
    .tr-header-sub { font-family: 'Inter', sans-serif; font-size: 0.875rem; color: rgba(255, 255, 255, 0.8); margin: 4px 0 0; }
    .tr-content { display: flex; flex-direction: column; gap: 24px; }
    .tr-loading { display: flex; align-items: center; gap: 12px; padding: 48px; justify-content: center; color: #64748b; }
    .tr-error { padding: 16px 24px; background: #fef2f2; color: #dc2626; border-radius: 12px; border: 1px solid #fecaca; font-weight: 500; }
    .tr-map-panel { height: 480px; margin-top: 12px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .tr-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
    .tr-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
    .tr-item mat-icon { color: #2563eb; }
    .tr-item-body { flex: 1; }
    .tr-item-title { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; }
    .tr-item-sub { font-size: 0.75rem; color: #64748b; }
    .tr-item-right { text-align: right; }
    .tr-item-time { display: block; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 0.8125rem; font-weight: 600; color: #1e293b; }
    .tr-item-date { font-size: 0.6875rem; color: #94a3b8; }
    .tr-no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly trips = signal<Trip[]>([]);
  readonly manifests = signal<Manifest[]>([]);
  readonly routes = signal<TransportRoute[]>([]);
  readonly telemetry = signal<FleetTelemetry[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.api.getTrips().subscribe({ next: (t) => this.trips.set(t) });
    this.api.getManifests().subscribe({ next: (m) => this.manifests.set(m) });

    this.api.getTransportRoutes().subscribe({
      next: (r) => this.routes.set(r),
    });

    this.api.getFleetTelemetry().subscribe({
      next: (t) => this.telemetry.set(t),
      complete: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load transport data. Please try again later.');
      },
    });
  }
}

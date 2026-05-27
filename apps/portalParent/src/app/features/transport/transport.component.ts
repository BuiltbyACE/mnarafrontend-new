import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../services/parent-api.service';
import { Trip, Manifest } from '../../models/parent.models';

@Component({
  selector: 'app-transport',
  imports: [MatCardModule, MatIconModule, MatTabsModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="transport-page">
      <h2>Transport</h2>
      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else {
        <mat-tab-group>
          <mat-tab label="Trips ({{ trips().length }})">
            @if (trips().length > 0) {
              <div class="list">
                @for (t of trips(); track t.id) {
                  <div class="item">
                    <mat-icon>directions_bus</mat-icon>
                    <div class="item-body">
                      <span class="item-title">{{ t.route_name }}</span>
                      <span class="item-sub">Driver: {{ t.driver_name }}</span>
                    </div>
                    <div class="item-right">
                      <span class="item-time">{{ t.departure_time }}</span>
                      <span class="item-date">{{ t.date | date:'shortDate' }}</span>
                    </div>
                  </div>
                }
              </div>
            } @else { <div class="no-data">No trips assigned</div> }
          </mat-tab>
          <mat-tab label="Manifests ({{ manifests().length }})">
            @if (manifests().length > 0) {
              <div class="list">
                @for (m of manifests(); track m.id) {
                  <div class="item">
                    <mat-icon>pin_drop</mat-icon>
                    <div class="item-body">
                      <span class="item-title">{{ m.student_name }}</span>
                      <span class="item-sub">Stop: {{ m.stop_name }}</span>
                    </div>
                    <span class="item-date">{{ m.trip_date | date:'shortDate' }}</span>
                  </div>
                }
              </div>
            } @else { <div class="no-data">No manifest entries</div> }
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .transport-page { padding: 16px 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
    .item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
    .item mat-icon { color: #2563eb; }
    .item-body { flex: 1; }
    .item-title { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; }
    .item-sub { font-size: 0.75rem; color: #64748b; }
    .item-right { text-align: right; }
    .item-time { display: block; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 0.8125rem; font-weight: 600; color: #1e293b; }
    .item-date { font-size: 0.6875rem; color: #94a3b8; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly trips = signal<Trip[]>([]);
  readonly manifests = signal<Manifest[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.getTrips().subscribe({ next: (t) => this.trips.set(t) });
    this.api.getManifests().subscribe({
      next: (m) => this.manifests.set(m),
      complete: () => this.loading.set(false),
    });
  }
}

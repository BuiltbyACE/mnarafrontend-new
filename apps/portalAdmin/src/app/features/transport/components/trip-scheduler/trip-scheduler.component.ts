import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransportService } from '../../services/transport.service';
import type { DailyTrip, FleetVehicle, TransportRoute } from '../../../../shared/models/transport.models';

interface UserOption { id: number; name: string; }

@Component({
  selector: 'app-trip-scheduler',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
  ],
  template: `
    <div class="ts-root">
      <!-- ── Header ── -->
      <div class="ts-header">
        <div class="ts-title">
          <mat-icon>event_available</mat-icon>
          Trip Scheduler
          <span class="badge badge-blue">{{ scheduledTrips().length }} Scheduled</span>
          <span class="badge badge-green">{{ activeTrips().length }} On Route</span>
        </div>
        <button class="btn-add" (click)="openPanel()">
          <mat-icon>add</mat-icon> Schedule Trip
        </button>
      </div>

      <!-- ── Create Trip Panel ── -->
      @if (panelOpen()) {
        <div class="panel">
          <div class="panel-title"><mat-icon>directions_bus</mat-icon> New Trip</div>
          <form #tripForm="ngForm" (ngSubmit)="createTrip(tripForm)" class="panel-form">
            <div class="grid-2">
              <div class="field-group">
                <label>Vehicle *</label>
                <select name="vehicle" [(ngModel)]="form.vehicle" required class="ep-select">
                  <option [ngValue]="null" disabled>— select vehicle —</option>
                  @for (v of vehicles(); track v.id) {
                    <option [ngValue]="v.id">{{ v.registration_number }} ({{ v.model_info }})</option>
                  }
                </select>
              </div>
              <div class="field-group">
                <label>Route *</label>
                <select name="route" [(ngModel)]="form.route" required class="ep-select">
                  <option [ngValue]="null" disabled>— select route —</option>
                  @for (r of routes(); track r.id) {
                    <option [ngValue]="r.id">{{ r.name }}</option>
                  }
                </select>
              </div>
              <div class="field-group">
                <label>Trip Type *</label>
                <select name="trip_type" [(ngModel)]="form.trip_type" required class="ep-select">
                  <option value="MORNING">Morning Pickup</option>
                  <option value="AFTERNOON">Afternoon Drop-off</option>
                </select>
              </div>
              <div class="field-group">
                <label>Driver *</label>
                <select name="driver" [(ngModel)]="form.driver" required class="ep-select">
                  <option [ngValue]="null" disabled>— select driver —</option>
                  @for (u of users(); track u.id) {
                    <option [ngValue]="u.id">{{ u.name }}</option>
                  }
                </select>
              </div>
              <div class="field-group">
                <label>Conductor *</label>
                <select name="conductor" [(ngModel)]="form.conductor" required class="ep-select">
                  <option [ngValue]="null" disabled>— select conductor —</option>
                  @for (u of users(); track u.id) {
                    <option [ngValue]="u.id">{{ u.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="panel-actions">
              <button type="submit" class="btn-save" [disabled]="tripForm.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="14"></mat-spinner> }
                @else { <mat-icon>event_available</mat-icon> }
                Schedule Trip
              </button>
              <button type="button" class="btn-cancel" (click)="panelOpen.set(false)">Cancel</button>
            </div>
            @if (panelError()) {
              <div class="ep-error"><mat-icon>error</mat-icon> {{ panelError() }}</div>
            }
          </form>
        </div>
      }

      <!-- ── Trips Table ── -->
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="22"></mat-spinner> Loading trips...</div>
      } @else if (allTrips().length === 0) {
        <div class="empty">
          <mat-icon>event_busy</mat-icon>
          <p>No trips today. Schedule a trip above.</p>
        </div>
      } @else {
        <div class="trips-section">
          @for (trip of allTrips(); track trip.id) {
            <div class="trip-row" [class]="'status-' + trip.status.toLowerCase()">
              <div class="trip-left">
                <div class="trip-reg">
                  <mat-icon>directions_bus</mat-icon>
                  {{ trip.vehicle_details?.registration_number ?? '—' }}
                </div>
                <div class="trip-meta">
                  <span class="chip type">{{ trip.trip_type === 'MORNING' ? '🌅 Morning' : '🌇 Afternoon' }}</span>
                  <span class="trip-route">{{ trip.route_name }}</span>
                </div>
                <div class="trip-people">
                  <mat-icon>person</mat-icon> {{ trip.driver_name }}
                  <span class="sep">·</span>
                  <mat-icon>badge</mat-icon> {{ trip.conductor_name }}
                </div>
              </div>
              <div class="trip-right">
                <span class="status-pill" [class]="'pill-' + trip.status.toLowerCase()">
                  {{ trip.status.replace('_', ' ') }}
                </span>
                @if (trip.start_time) {
                  <span class="trip-time">Started {{ trip.start_time | date:'h:mm a' }}</span>
                }
                @if (trip.passenger_count != null) {
                  <span class="pax">
                    <mat-icon>group</mat-icon> {{ trip.passenger_count }}
                  </span>
                }
                <div class="trip-actions">
                  @if (trip.status === 'SCHEDULED') {
                    <button class="icon-btn cancel-btn" matTooltip="Cancel trip" (click)="cancelTrip(trip)">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  }
                  @if (trip.status === 'SCHEDULED' || trip.status === 'ON_ROUTE') {
                    <button class="icon-btn emergency-btn" matTooltip="Emergency stop" (click)="emergencyStop(trip)">
                      <mat-icon>emergency</mat-icon>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; }
    .ts-root { padding: 0; }

    .ts-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px;
    }
    .ts-title { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .ts-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #8b5cf6; }
    .badge { font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 100px; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .btn-add {
      display: flex; align-items: center; gap: 6px; padding: 8px 16px;
      border-radius: 8px; border: none; background: #7c3aed; color: white;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
    }
    .btn-add:hover { background: #6d28d9; }
    .btn-add mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Panel */
    .panel { margin: 16px 20px; border: 1px solid #ddd6fe; border-radius: 10px; background: #faf5ff; overflow: hidden; }
    .panel-title {
      display: flex; align-items: center; gap: 8px; padding: 11px 16px;
      background: #ddd6fe; color: #6d28d9; font-size: 0.84rem; font-weight: 700;
    }
    .panel-title mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .panel-form { padding: 14px 16px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .field-group label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .3px; }
    .ep-select {
      padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 7px;
      font-size: 0.82rem; color: #0f172a; background: white;
      outline: none; transition: border-color 0.15s; font-family: inherit; width: 100%;
    }
    .ep-select:focus { border-color: #7c3aed; }
    .panel-actions { display: flex; gap: 10px; align-items: center; }
    .btn-save {
      display: flex; align-items: center; gap: 6px; padding: 8px 18px;
      background: #7c3aed; color: white; border: none; border-radius: 7px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
    }
    .btn-save:hover:not(:disabled) { background: #6d28d9; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-save mat-icon, .btn-save mat-spinner { font-size: 14px; width: 14px; height: 14px; }
    .btn-cancel {
      padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 7px;
      background: white; color: #64748b; font-size: 0.8rem; cursor: pointer; font-family: inherit;
    }
    .ep-error { display: flex; align-items: center; gap: 6px; margin-top: 10px;
                padding: 8px 12px; background: #fef2f2; border-radius: 6px;
                color: #dc2626; font-size: 0.78rem; }
    .ep-error mat-icon { font-size: 13px; width: 13px; height: 13px; }

    /* Trip rows */
    .loading { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: #94a3b8; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #94a3b8; }
    .empty mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .4; }
    .empty p { margin: 0; font-size: 0.85rem; }

    .trips-section { padding: 12px 20px; display: flex; flex-direction: column; gap: 8px; }
    .trip-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
      background: white; transition: box-shadow 0.12s; flex-wrap: wrap;
    }
    .trip-row:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
    .trip-row.status-on_route { border-left: 3px solid #22c55e; }
    .trip-row.status-scheduled { border-left: 3px solid #3b82f6; }
    .trip-row.status-completed { border-left: 3px solid #94a3b8; opacity: .65; }
    .trip-row.status-cancelled { border-left: 3px solid #f59e0b; opacity: .55; }
    .trip-row.status-emergency_stop { border-left: 3px solid #ef4444; }

    .trip-left { display: flex; flex-direction: column; gap: 4px; }
    .trip-reg {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.95rem; font-weight: 700; color: #0f172a;
    }
    .trip-reg mat-icon { font-size: 16px; width: 16px; height: 16px; color: #3b82f6; }
    .trip-meta { display: flex; align-items: center; gap: 8px; }
    .chip { font-size: 0.7rem; }
    .trip-route { font-size: 0.75rem; color: #64748b; }
    .trip-people {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.72rem; color: #94a3b8;
    }
    .trip-people mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .sep { color: #e2e8f0; }

    .trip-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .status-pill {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
      padding: 3px 9px; border-radius: 100px;
    }
    .pill-scheduled { background: #dbeafe; color: #1d4ed8; }
    .pill-on_route { background: #dcfce7; color: #16a34a; }
    .pill-completed { background: #f1f5f9; color: #64748b; }
    .pill-cancelled { background: #fef3c7; color: #b45309; }
    .pill-emergency_stop { background: #fee2e2; color: #dc2626; }
    .trip-time { font-size: 0.72rem; color: #94a3b8; }
    .pax { display: flex; align-items: center; gap: 3px; font-size: 0.72rem; color: #475569; }
    .pax mat-icon { font-size: 13px; width: 13px; height: 13px; }

    .trip-actions { display: flex; gap: 4px; }
    .icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 6px; border: 1px solid transparent;
      cursor: pointer; background: transparent; transition: all 0.12s;
    }
    .icon-btn mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .cancel-btn { color: #f59e0b; }
    .cancel-btn:hover { background: #fef3c7; border-color: #fde68a; }
    .emergency-btn { color: #ef4444; }
    .emergency-btn:hover { background: #fee2e2; border-color: #fecaca; }
  `],
})
export class TripSchedulerComponent implements OnInit {
  readonly svc = inject(TransportService);
  private snack = inject(MatSnackBar);

  readonly allTrips = signal<DailyTrip[]>([]);
  readonly vehicles = signal<FleetVehicle[]>([]);
  readonly routes = signal<TransportRoute[]>([]);
  readonly users = signal<UserOption[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly panelOpen = signal(false);
  readonly panelError = signal<string | null>(null);

  readonly scheduledTrips = computed(() => this.allTrips().filter(t => t.status === 'SCHEDULED'));
  readonly activeTrips = computed(() => this.allTrips().filter(t => t.status === 'ON_ROUTE'));

  form: { vehicle: number | null; route: number | null; trip_type: string; driver: number | null; conductor: number | null } =
    { vehicle: null, route: null, trip_type: 'MORNING', driver: null, conductor: null };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.svc.getDailyTrips().subscribe({ next: t => { this.allTrips.set(t); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.svc.getVehicles().subscribe({ next: r => this.vehicles.set(r.results) });
    this.svc.getRoutes().subscribe({ next: r => this.routes.set(r) });
  }

  openPanel(): void {
    this.form = { vehicle: null, route: null, trip_type: 'MORNING', driver: null, conductor: null };
    this.panelError.set(null);
    this.panelOpen.set(true);
  }

  createTrip(form: NgForm): void {
    if (form.invalid) return;
    this.saving.set(true);
    this.panelError.set(null);
    this.svc.createTrip(this.form as Parameters<typeof this.svc.createTrip>[0]).subscribe({
      next: () => {
        this.saving.set(false);
        this.panelOpen.set(false);
        this.loadAll();
        this.snack.open('Trip scheduled', 'Close', { duration: 3000 });
      },
      error: (err: Error) => { this.saving.set(false); this.panelError.set(err.message); },
    });
  }

  cancelTrip(trip: DailyTrip): void {
    if (!confirm(`Cancel trip for ${trip.vehicle_details?.registration_number}?`)) return;
    this.svc.cancelTrip(trip.id).subscribe({
      next: () => { this.allTrips.update(list => list.map(t => t.id === trip.id ? { ...t, status: 'CANCELLED' as const } : t)); this.snack.open('Trip cancelled', 'Close', { duration: 3000 }); },
      error: (err: Error) => this.snack.open(err.message, 'Close', { duration: 4000 }),
    });
  }

  emergencyStop(trip: DailyTrip): void {
    if (!confirm(`EMERGENCY STOP for ${trip.vehicle_details?.registration_number}? This is irreversible.`)) return;
    this.svc.emergencyStopTrip(trip.id).subscribe({
      next: () => { this.allTrips.update(list => list.map(t => t.id === trip.id ? { ...t, status: 'EMERGENCY_STOP' as const } : t)); this.snack.open('Emergency stop issued', 'Close', { duration: 5000 }); },
      error: (err: Error) => this.snack.open(err.message, 'Close', { duration: 4000 }),
    });
  }
}

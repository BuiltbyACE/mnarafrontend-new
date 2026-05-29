import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransportService } from '../../services/transport.service';
import type { TransportRoute, RouteStop } from '../../../../shared/models/transport.models';

interface StopDraft {
  _key: number;
  id?: number;
  name: string;
  order: number;
  latitude: string;
  longitude: string;
  estimated_arrival_offset: string;
}

let _key = 0;
const nextKey = () => ++_key;

@Component({
  selector: 'app-route-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DecimalPipe, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
  ],
  template: `
    <div class="rm-root">
      <!-- ── Header ── -->
      <div class="rm-header">
        <div class="rm-title">
          <mat-icon>alt_route</mat-icon>
          Routes &amp; Checkpoints
          <span class="badge">{{ routes().length }} routes</span>
        </div>
        <button class="btn-add" (click)="openRoutePanel()">
          <mat-icon>add</mat-icon> New Route
        </button>
      </div>

      <!-- ── Route Create / Edit Panel ── -->
      @if (routePanelOpen()) {
        <div class="panel">
          <div class="panel-title">
            <mat-icon>{{ editingRoute() ? 'edit' : 'add_circle' }}</mat-icon>
            {{ editingRoute() ? 'Edit Route' : 'Create Route' }}
          </div>
          <form #routeForm="ngForm" (ngSubmit)="saveRoute(routeForm)" class="panel-form">
            <div class="field-row">
              <div class="field-group">
                <label>Route Name *</label>
                <input name="routeName" [(ngModel)]="routeFormData.name" required
                       placeholder="e.g. Route A — Westlands" class="ep-input" />
              </div>
              <div class="field-group center-label">
                <label>Active</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="routeActive" [(ngModel)]="routeFormData.is_active" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            <div class="panel-actions">
              <button type="submit" class="btn-save" [disabled]="routeForm.invalid || saving()">
                @if (saving()) { <mat-spinner diameter="14"></mat-spinner> }
                @else { <mat-icon>save</mat-icon> }
                {{ editingRoute() ? 'Update Route' : 'Create Route' }}
              </button>
              <button type="button" class="btn-cancel" (click)="closeRoutePanel()">Cancel</button>
            </div>
            @if (panelError()) {
              <div class="ep-error"><mat-icon>error</mat-icon> {{ panelError() }}</div>
            }
          </form>
        </div>
      }

      <!-- ── Route List ── -->
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="24"></mat-spinner> Loading routes...</div>
      } @else if (routes().length === 0) {
        <div class="empty">
          <mat-icon>alt_route</mat-icon>
          <p>No routes yet. Create your first route above.</p>
        </div>
      } @else {
        <div class="routes-list">
          @for (route of routes(); track route.id) {
            <div class="route-card" [class.route-inactive]="!route.is_active">
              <!-- Route header row -->
              <div class="route-head">
                <div class="route-left">
                  <mat-icon class="route-icon">directions_bus</mat-icon>
                  <div class="route-name-block">
                    <span class="route-name">{{ route.name }}</span>
                    <span class="stop-count">{{ route.stops?.length ?? 0 }} stops</span>
                  </div>
                  <span class="route-status" [class.active]="route.is_active">
                    {{ route.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="route-actions">
                  <button class="icon-btn edit" matTooltip="Edit route name" (click)="editRoute(route)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="icon-btn stops" matTooltip="Manage stops"
                          (click)="toggleStops(route.id)">
                    <mat-icon>{{ expandedRouteId() === route.id ? 'expand_less' : 'place' }}</mat-icon>
                  </button>
                  <button class="icon-btn delete" matTooltip="Delete route" (click)="deleteRoute(route)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Stops editor (expanded) -->
              @if (expandedRouteId() === route.id) {
                <div class="stops-section">
                  <div class="stops-header">
                    <span>Checkpoints (stops in order)</span>
                    <button class="btn-add-stop" (click)="addStopDraft()">
                      <mat-icon>add_location</mat-icon> Add Stop
                    </button>
                  </div>

                  @if (stopDrafts().length === 0) {
                    <div class="no-stops">No stops yet. Add checkpoints for this route.</div>
                  } @else {
                    <div class="stops-list">
                      @for (stop of stopDrafts(); track stop._key; let i = $index) {
                        <div class="stop-row">
                          <div class="stop-order">{{ i + 1 }}</div>
                          <input class="stop-input" [(ngModel)]="stop.name"
                                 placeholder="Stop name (e.g. Westlands Gate)" />
                          <input class="stop-input coord" [(ngModel)]="stop.latitude"
                                 placeholder="Latitude (-1.2921)" />
                          <input class="stop-input coord" [(ngModel)]="stop.longitude"
                                 placeholder="Longitude (36.8219)" />
                          <input class="stop-input offset" [(ngModel)]="stop.estimated_arrival_offset"
                                 placeholder="Offset (00:15:00)" />
                          <button class="icon-btn delete" (click)="removeStopDraft(stop._key)">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  }

                  <div class="stops-footer">
                    <button class="btn-save-stops" [disabled]="savingStops()" (click)="saveStops(route)">
                      @if (savingStops()) { <mat-spinner diameter="14"></mat-spinner> }
                      @else { <mat-icon>save</mat-icon> }
                      Save All Stops
                    </button>
                    @if (stopsError()) {
                      <span class="stops-error">{{ stopsError() }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; }
    .rm-root { padding: 0; }

    /* ── Header ── */
    .rm-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px;
    }
    .rm-title { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .rm-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #059669; }
    .badge { font-size: 0.65rem; font-weight: 700; background: #dcfce7; color: #16a34a;
             padding: 2px 8px; border-radius: 100px; }
    .btn-add {
      display: flex; align-items: center; gap: 6px; padding: 8px 16px;
      border-radius: 8px; border: none; background: #059669; color: white;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
    }
    .btn-add:hover { background: #047857; }
    .btn-add mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* ── Panel ── */
    .panel {
      margin: 16px 20px; border: 1px solid #bbf7d0; border-radius: 10px;
      background: #f0fdf4; overflow: hidden;
    }
    .panel-title {
      display: flex; align-items: center; gap: 8px; padding: 11px 16px;
      background: #bbf7d0; color: #15803d; font-size: 0.84rem; font-weight: 700;
    }
    .panel-title mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .panel-form { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
    .field-row { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: end; }
    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .field-group label, .center-label label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .3px; }
    .center-label { align-items: flex-start; }
    .ep-input {
      padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 7px;
      font-size: 0.82rem; color: #0f172a; background: white;
      outline: none; transition: border-color 0.15s; font-family: inherit; width: 100%; box-sizing: border-box;
    }
    .ep-input:focus { border-color: #059669; }
    .panel-actions { display: flex; align-items: center; gap: 10px; }
    .btn-save {
      display: flex; align-items: center; gap: 6px; padding: 8px 18px;
      background: #059669; color: white; border: none; border-radius: 7px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
    }
    .btn-save:hover:not(:disabled) { background: #047857; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-save mat-icon, .btn-save mat-spinner { font-size: 14px; width: 14px; height: 14px; }
    .btn-cancel {
      padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 7px;
      background: white; color: #64748b; font-size: 0.8rem; cursor: pointer; font-family: inherit;
    }
    .ep-error { display: flex; align-items: center; gap: 6px; padding: 7px 10px;
                background: #fef2f2; border-radius: 6px; color: #dc2626; font-size: 0.76rem; }
    .ep-error mat-icon { font-size: 13px; width: 13px; height: 13px; }

    /* Toggle switch */
    .toggle-switch { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .toggle-switch input { display: none; }
    .slider {
      width: 36px; height: 20px; background: #cbd5e1; border-radius: 100px;
      position: relative; transition: background 0.2s;
    }
    .slider::after {
      content: ''; position: absolute; width: 14px; height: 14px;
      background: white; border-radius: 50%; top: 3px; left: 3px; transition: left 0.2s;
    }
    .toggle-switch input:checked + .slider { background: #059669; }
    .toggle-switch input:checked + .slider::after { left: 19px; }

    /* ── Route List ── */
    .loading { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: #94a3b8; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #94a3b8; }
    .empty mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .4; }
    .empty p { margin: 0; font-size: 0.85rem; }

    .routes-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }

    .route-card {
      border: 1px solid #e2e8f0; border-radius: 10px;
      overflow: hidden; background: white;
      transition: box-shadow 0.15s;
    }
    .route-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .route-inactive { opacity: 0.6; }

    .route-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; gap: 10px;
    }
    .route-left { display: flex; align-items: center; gap: 10px; }
    .route-icon { font-size: 18px; width: 18px; height: 18px; color: #3b82f6; flex-shrink: 0; }
    .route-name-block { display: flex; flex-direction: column; }
    .route-name { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .stop-count { font-size: 0.68rem; color: #94a3b8; }
    .route-status {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 8px; border-radius: 100px; background: #f1f5f9; color: #94a3b8;
    }
    .route-status.active { background: #dcfce7; color: #16a34a; }

    .route-actions { display: flex; gap: 4px; }
    .icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 6px; border: 1px solid transparent;
      cursor: pointer; background: transparent; transition: all 0.12s;
    }
    .icon-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .icon-btn.edit { color: #2563eb; }
    .icon-btn.edit:hover { background: #dbeafe; border-color: #bfdbfe; }
    .icon-btn.stops { color: #059669; }
    .icon-btn.stops:hover { background: #dcfce7; border-color: #bbf7d0; }
    .icon-btn.delete { color: #dc2626; }
    .icon-btn.delete:hover { background: #fee2e2; border-color: #fecaca; }

    /* ── Stops Section ── */
    .stops-section { border-top: 1px solid #e2e8f0; background: #f8fafc; padding: 14px 16px; }
    .stops-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px; font-size: 0.75rem; font-weight: 700; color: #475569;
    }
    .btn-add-stop {
      display: flex; align-items: center; gap: 5px; padding: 5px 12px;
      border-radius: 6px; border: 1px solid #bbf7d0; background: #f0fdf4;
      color: #16a34a; font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: inherit;
    }
    .btn-add-stop mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .no-stops { text-align: center; padding: 16px; color: #94a3b8; font-size: 0.8rem; }

    .stops-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .stop-row {
      display: grid;
      grid-template-columns: 24px 1fr 100px 100px 100px 28px;
      gap: 6px; align-items: center;
    }
    .stop-order {
      width: 22px; height: 22px; border-radius: 50%; background: #3b82f6; color: white;
      font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stop-input {
      padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px;
      font-size: 0.78rem; color: #0f172a; background: white; outline: none;
      transition: border-color 0.12s; font-family: inherit; width: 100%; box-sizing: border-box;
    }
    .stop-input:focus { border-color: #3b82f6; }
    .stop-input.coord { font-family: monospace; font-size: 0.72rem; }
    .stop-input.offset { font-family: monospace; font-size: 0.72rem; }

    .stops-footer { display: flex; align-items: center; gap: 12px; }
    .btn-save-stops {
      display: flex; align-items: center; gap: 6px; padding: 7px 16px;
      background: #2563eb; color: white; border: none; border-radius: 7px;
      font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
    }
    .btn-save-stops:hover:not(:disabled) { background: #1d4ed8; }
    .btn-save-stops:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-save-stops mat-icon, .btn-save-stops mat-spinner { font-size: 14px; width: 14px; height: 14px; }
    .stops-error { font-size: 0.75rem; color: #dc2626; }
  `],
})
export class RouteManagerComponent {
  readonly svc = inject(TransportService);
  private snack = inject(MatSnackBar);

  readonly routes = signal<TransportRoute[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly savingStops = signal(false);
  readonly routePanelOpen = signal(false);
  readonly editingRoute = signal<TransportRoute | null>(null);
  readonly expandedRouteId = signal<number | null>(null);
  readonly stopDrafts = signal<StopDraft[]>([]);
  readonly panelError = signal<string | null>(null);
  readonly stopsError = signal<string | null>(null);

  routeFormData: { name: string; is_active: boolean } = { name: '', is_active: true };

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getRoutes().subscribe({ next: r => { this.routes.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openRoutePanel(): void {
    this.editingRoute.set(null);
    this.routeFormData = { name: '', is_active: true };
    this.panelError.set(null);
    this.routePanelOpen.set(true);
  }

  editRoute(r: TransportRoute): void {
    this.editingRoute.set(r);
    this.routeFormData = { name: r.name, is_active: r.is_active };
    this.panelError.set(null);
    this.routePanelOpen.set(true);
  }

  closeRoutePanel(): void { this.routePanelOpen.set(false); this.editingRoute.set(null); }

  saveRoute(form: NgForm): void {
    if (form.invalid) return;
    this.saving.set(true);
    this.panelError.set(null);
    const editing = this.editingRoute();
    const req$ = editing
      ? this.svc.updateRoute(editing.id, this.routeFormData)
      : this.svc.createRoute(this.routeFormData);

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeRoutePanel(); this.load(); this.snack.open(editing ? 'Route updated' : 'Route created', 'Close', { duration: 3000 }); },
      error: (err: Error) => { this.saving.set(false); this.panelError.set(err.message); },
    });
  }

  deleteRoute(r: TransportRoute): void {
    if (!confirm(`Delete route "${r.name}"? All stops will be removed.`)) return;
    this.svc.deleteRoute(r.id).subscribe({
      next: () => { this.routes.update(list => list.filter(x => x.id !== r.id)); this.snack.open('Route deleted', 'Close', { duration: 3000 }); },
      error: (err: Error) => this.snack.open(err.message, 'Close', { duration: 4000 }),
    });
  }

  toggleStops(routeId: number): void {
    if (this.expandedRouteId() === routeId) {
      this.expandedRouteId.set(null);
      return;
    }
    this.expandedRouteId.set(routeId);
    const route = this.routes().find(r => r.id === routeId);
    if (route) {
      this.stopDrafts.set((route.stops ?? []).map(s => ({
        _key: nextKey(), id: s.id, name: s.name, order: s.order,
        latitude: String(s.latitude), longitude: String(s.longitude),
        estimated_arrival_offset: s.estimated_arrival_offset,
      })));
    } else {
      this.stopDrafts.set([]);
    }
    this.stopsError.set(null);
  }

  addStopDraft(): void {
    const next = this.stopDrafts().length + 1;
    this.stopDrafts.update(list => [
      ...list,
      { _key: nextKey(), name: '', order: next, latitude: '', longitude: '', estimated_arrival_offset: '00:15:00' },
    ]);
  }

  removeStopDraft(key: number): void {
    this.stopDrafts.update(list => {
      const filtered = list.filter(s => s._key !== key);
      return filtered.map((s, i) => ({ ...s, order: i + 1 }));
    });
  }

  saveStops(route: TransportRoute): void {
    this.savingStops.set(true);
    this.stopsError.set(null);
    const stops = this.stopDrafts().map((s, i) => ({
      name: s.name, order: i + 1,
      latitude: s.latitude, longitude: s.longitude,
      estimated_arrival_offset: s.estimated_arrival_offset || '00:15:00',
    }));
    this.svc.setRouteStops(route.id, stops).subscribe({
      next: (res) => {
        this.savingStops.set(false);
        // Refresh routes to update stop count
        this.load();
        // Update drafts with returned IDs
        this.stopDrafts.set(res.stops.map(s => ({
          _key: nextKey(), id: s.id, name: s.name, order: s.order,
          latitude: String(s.latitude), longitude: String(s.longitude),
          estimated_arrival_offset: s.estimated_arrival_offset,
        })));
        this.snack.open(`${res.stops.length} stops saved`, 'Close', { duration: 3000 });
      },
      error: (err: Error) => { this.savingStops.set(false); this.stopsError.set(err.message); },
    });
  }
}

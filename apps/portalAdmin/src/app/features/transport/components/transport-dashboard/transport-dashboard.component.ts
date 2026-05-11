import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@sms/core/auth';
import { TransportService } from '../../services/transport.service';
import { FleetMapComponent } from '../fleet-map/fleet-map';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { ManifestDrawerComponent } from '../manifest-drawer/manifest-drawer.component';
import { DeviceManagerComponent } from '../device-manager/device-manager.component';
import { TelemetryGaugeComponent } from '../telemetry-gauge/telemetry-gauge.component';
import { IncidentTickerComponent } from '../incident-ticker/incident-ticker.component';
import { RouteStepperComponent } from '../route-stepper/route-stepper.component';
import type { FleetTelemetry, DailyTrip } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-transport-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatTabsModule, MatFormFieldModule, MatInputModule,
    FleetMapComponent, TripCardComponent, ManifestDrawerComponent,
    DeviceManagerComponent, TelemetryGaugeComponent, IncidentTickerComponent,
    RouteStepperComponent,
  ],
  template: `
    <div class="dashboard-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Transport Command Center</h1>
          <p class="subtitle">Real-time fleet tracking & operations — Nairobi Metro Area</p>
        </div>
        <div class="header-actions">
          <span class="live-indicator" [class.connected]="service.wsConnected()">
            <span class="indicator-dot"></span>
            <span class="indicator-text">{{ service.wsConnected() ? 'Live' : 'Disconnected' }}</span>
          </span>
          <button mat-stroked-button (click)="refreshDashboard()" [disabled]="isLoading()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </header>

      @if (isLoading() && !dashboardData()) {
        <mat-progress-bar mode="indeterminate" class="top-bar"></mat-progress-bar>
      }

      @if (error(); as err) {
        <div class="error-alert">
          <mat-icon>error</mat-icon> <span>{{ err }}</span>
          <button mat-button color="primary" (click)="loadData()">Retry</button>
        </div>
      }

      @if (dashboardData(); as data) {
        <div class="kpi-grid">
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon fleet-icon"><mat-icon>directions_bus</mat-icon></div>
              <div class="kpi-body">
                <span class="kpi-value">{{ data.fleet_summary.total_vehicles }}</span>
                <span class="kpi-label">Total Vehicles</span>
                <div class="kpi-sublabels">
                  <span class="sublabel active">{{ data.fleet_summary.active_trips }} Active</span>
                  <span class="sublabel warn">{{ data.fleet_summary.maintenance_due }} Maintenance</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon safety-icon"><mat-icon>school</mat-icon></div>
              <div class="kpi-body">
                <span class="kpi-value">{{ data.student_safety.students_in_transit }}</span>
                <span class="kpi-label">Students in Transit</span>
                <div class="kpi-sublabels">
                  <span class="sublabel"
                       [class.text-success]="data.student_safety.manifest_completion_pct >= 90"
                       [class.text-warning]="data.student_safety.manifest_completion_pct < 90">
                    {{ data.student_safety.manifest_completion_pct }}% Manifest Complete
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card" [class.alert-card]="data.compliance_alerts > 0">
            <mat-card-content>
              <div class="kpi-icon compliance-icon"><mat-icon>gavel</mat-icon></div>
              <div class="kpi-body">
                <span class="kpi-value" [class.text-danger]="data.compliance_alerts > 0">{{ data.compliance_alerts }}</span>
                <span class="kpi-label">Compliance Alerts</span>
                <div class="kpi-sublabels">
                  @if (data.compliance_alerts > 0) {
                    <span class="sublabel danger">Expiring permits/insurance</span>
                  } @else {
                    <span class="sublabel">All compliant</span>
                  }
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon punctuality-icon"><mat-icon>schedule</mat-icon></div>
              <div class="kpi-body">
                <span class="kpi-value"
                     [class.text-success]="data.punctuality.on_time_pct >= 85"
                     [class.text-warning]="data.punctuality.on_time_pct >= 60 && data.punctuality.on_time_pct < 85"
                     [class.text-danger]="data.punctuality.on_time_pct < 60">
                  {{ data.punctuality.on_time_pct }}%
                </span>
                <span class="kpi-label">On-Time Performance</span>
                <div class="kpi-sublabels">
                  <span class="sublabel">{{ data.punctuality.delayed_trips }} delayed of {{ data.punctuality.total_trips }} trips</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="war-room">
          <aside class="left-sidebar">
            <div class="trip-search">
              <mat-icon>search</mat-icon>
              <input [(ngModel)]="searchQuery" placeholder="Search trips..." class="search-input">
            </div>

            <div class="trip-list-section">
              <div class="section-header">
                <span class="section-title">
                  <mat-icon>directions_bus</mat-icon> Active Trips
                </span>
                <span class="section-count">{{ activeTripCards().length }}</span>
              </div>
              <div class="trip-cards-scroll">
                @for (trip of activeTripCards(); track trip.id) {
                  <app-trip-card
                    [trip]="trip"
                    [telemetry]="getTripTelemetry(trip)"
                    [isFocused]="focusedTripId() === trip.id"
                    (tripClick)="openManifest($event)"
                    (emergencyStop)="onEmergencyStop($event)"
                    (focusClick)="focusTripBy($event)"
                  />
                } @empty {
                  <div class="empty-trips">
                    <mat-icon>directions_off</mat-icon>
                    <p>No active trips</p>
                  </div>
                }
              </div>
            </div>

            <div class="route-stepper-section">
              <div class="section-header">
                <span class="section-title">
                  <mat-icon>alt_route</mat-icon> Route Progress
                </span>
              </div>
              @if (selectedTrip(); as st) {
                <app-route-stepper
                  [trip]="st"
                  [currentLat]="selectedTripTelemetry()?.latitude ?? null"
                  [currentLng]="selectedTripTelemetry()?.longitude ?? null"
                />
              } @else {
                <div class="no-selection">
                  <mat-icon>tap</mat-icon>
                  <p>Click a trip card to view route</p>
                </div>
              }
            </div>
          </aside>

          <main class="center-panel">
            <div class="map-container">
              @if (fleetTelemetry().length > 0) {
                <app-fleet-map
                  [telemetryData]="fleetTelemetry()"
                  [showReconnecting]="service.wsReconnecting()"
                  [focusTripId]="focusedTripId()"
                  (markerClick)="onMarkerClick($event)"
                />
                <app-telemetry-gauge [telemetryData]="fleetTelemetry()" />
              } @else {
                <div class="map-placeholder">
                  <mat-icon>map</mat-icon>
                  <p>Waiting for GPS telemetry...</p>
                </div>
              }
            </div>

            <mat-tab-group class="bottom-tabs" dynamicHeight>
              <mat-tab label="Device Management">
                <app-device-manager />
              </mat-tab>
              <mat-tab label="Reports">
                <div class="reports-tab">
                  <div class="report-actions">
                    <button mat-raised-button color="primary" (click)="downloadDailyTripLog()" [disabled]="reportLoading()">
                      <mat-icon>picture_as_pdf</mat-icon> Daily Trip Log (PDF)
                    </button>
                    <button mat-raised-button color="accent" (click)="downloadStudentCommuterList()" [disabled]="reportLoading()">
                      <mat-icon>table_chart</mat-icon> Student Commuter List (Excel)
                    </button>
                    <button mat-stroked-button (click)="downloadReport('pdf', 'fleet_utilization')" [disabled]="reportLoading()">
                      <mat-icon>assessment</mat-icon> Fleet Utilization (PDF)
                    </button>
                    <button mat-stroked-button (click)="downloadReport('xlsx', 'fuel_maintenance')" [disabled]="reportLoading()">
                      <mat-icon>local_gas_station</mat-icon> Fuel & Maintenance (Excel)
                    </button>
                  </div>
                  @if (reportError()) {
                    <div class="report-error"><mat-icon>error_outline</mat-icon><span>{{ reportError() }}</span></div>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </main>

          <aside class="right-sidebar">
            @if (canViewIncidents()) {
              <mat-card class="sidebar-card incidents-card">
                <mat-card-content class="no-padding">
                  <app-incident-ticker [incidents]="data.incidents" />
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card class="sidebar-card">
                <mat-card-content>
                  <div class="access-restricted">
                    <mat-icon>lock</mat-icon>
                    <p>Incidents Restricted</p>
                    <span class="restricted-hint">No permission to view incident data.</span>
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <mat-card class="sidebar-card health-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>monitor_heart</mat-icon> Fleet Health
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="health-metrics">
                  <div class="health-item">
                    <span class="health-dot green"></span>
                    <span class="health-label">Online</span>
                    <span class="health-value">{{ onlineVehicles() }}</span>
                  </div>
                  <div class="health-item">
                    <span class="health-dot amber"></span>
                    <span class="health-label">Idle</span>
                    <span class="health-value">{{ idleVehicles() }}</span>
                  </div>
                  <div class="health-item">
                    <span class="health-dot gray"></span>
                    <span class="health-label">Offline</span>
                    <span class="health-value">{{ offlineVehicles() }}</span>
                  </div>
                </div>
                <div class="fleet-occupancy">
                  <span class="section-label">Fleet Occupancy</span>
                  <div class="occupancy-bar">
                    <div class="occupancy-fill" [style.width.%]="avgOccupancyPct()" [class]="avgOccupancyColor()"></div>
                  </div>
                  <span class="occupancy-pct">{{ avgOccupancyPct() }}% Average</span>
                </div>
              </mat-card-content>
            </mat-card>
          </aside>
        </div>
      }

      @if (!dashboardData() && !isLoading() && !error()) {
        <div class="initial-load">
          <button mat-raised-button color="primary" (click)="loadData()">
            <mat-icon>directions_bus</mat-icon> Load Transport Dashboard
          </button>
        </div>
      }

      <app-manifest-drawer
        [trip]="manifestTrip()"
        [isOpen]="manifestOpen()"
        (closeDrawerEvent)="closeManifest()"
      />
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 20px; max-width: 100%; min-height: 100vh; background: #f1f5f9; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .page-header .title-section h1 { font-size: 22px; font-weight: 700; margin: 0 0 2px 0; color: #0f172a; }
    .page-header .title-section .subtitle { color: #64748b; margin: 0; font-size: 0.8rem; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .top-bar { border-radius: 4px; margin-bottom: 16px; }
    .error-alert { display: flex; align-items: center; gap: 8px; padding: 14px 20px; background: #fee2e2; border-radius: 10px; color: #dc2626; margin-bottom: 20px; font-size: 0.875rem; }

    .live-indicator { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; background: #f1f5f9; color: #94a3b8; }
    .live-indicator.connected { background: #ecfdf5; color: #059669; }
    .indicator-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
    .live-indicator.connected .indicator-dot { background: #10b981; animation: pulse-ring 1.5s infinite; }
    .indicator-text { text-transform: uppercase; letter-spacing: 0.5px; }
    @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); } 70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

    .initial-load { display: flex; justify-content: center; padding: 64px 0; }
    .initial-load button { padding: 16px 32px; font-size: 1rem; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }
    .kpi-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .kpi-card.alert-card { background: #fef2f2; border-color: #fecaca; }
    .kpi-card mat-card-content { display: flex; align-items: flex-start; gap: 14px; padding: 18px; }
    .kpi-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon mat-icon { color: white; font-size: 20px; width: 20px; height: 20px; }
    .fleet-icon { background: #3b82f6; }
    .safety-icon { background: #10b981; }
    .compliance-icon { background: #f59e0b; }
    .punctuality-icon { background: #8b5cf6; }
    .kpi-body { display: flex; flex-direction: column; gap: 2px; }
    .kpi-value { font-size: 1.6rem; font-weight: 700; color: #0f172a; line-height: 1.1; }
    .kpi-value.text-success { color: #059669; }
    .kpi-value.text-warning { color: #d97706; }
    .kpi-value.text-danger { color: #dc2626; }
    .kpi-label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
    .kpi-sublabels { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
    .sublabel { font-size: 0.7rem; color: #64748b; }
    .sublabel.active { color: #059669; font-weight: 600; }
    .sublabel.warn { color: #d97706; }
    .sublabel.danger { color: #dc2626; font-weight: 600; }
    .text-success { color: #059669; }
    .text-warning { color: #d97706; }
    .text-danger { color: #dc2626; }

    .war-room { display: grid; grid-template-columns: 320px 1fr 280px; gap: 16px; min-height: calc(100vh - 260px); }
    @media (max-width: 1400px) { .war-room { grid-template-columns: 280px 1fr 240px; } }
    @media (max-width: 1200px) { .war-room { grid-template-columns: 1fr; } }

    .left-sidebar { display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
    .trip-search { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: white; border-radius: 10px; border: 1px solid #e2e8f0; }
    .trip-search mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
    .search-input { border: none; outline: none; flex: 1; font-size: 0.8rem; color: #1e293b; background: transparent; }
    .search-input::placeholder { color: #94a3b8; }

    .trip-list-section, .route-stepper-section { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .section-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
    .section-title { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: #1e293b; }
    .section-title mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .section-count { margin-left: auto; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 10px; font-size: 0.65rem; font-weight: 600; }

    .trip-cards-scroll { display: flex; flex-direction: column; gap: 8px; padding: 12px; max-height: 460px; overflow-y: auto; }
    .empty-trips { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: #94a3b8; }
    .empty-trips mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: 0.5; }
    .empty-trips p { margin: 0; font-size: 0.8rem; }

    .no-selection { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; color: #94a3b8; }
    .no-selection mat-icon { font-size: 24px; width: 24px; height: 24px; opacity: 0.5; }
    .no-selection p { margin: 0; font-size: 0.75rem; }

    .center-panel { display: flex; flex-direction: column; gap: 12px; }
    .map-container { position: relative; height: 480px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .map-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #94a3b8; background: #f8fafc; }
    .map-placeholder mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }
    .map-placeholder p { margin: 0; font-size: 0.875rem; }

    .bottom-tabs { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .bottom-tabs ::ng-deep .mat-mdc-tab-header { border-bottom: 1px solid #e2e8f0; }
    .bottom-tabs ::ng-deep .mat-mdc-tab { font-size: 0.8rem; font-weight: 500; min-width: 120px; }
    .bottom-tabs ::ng-deep .mat-mdc-tab-body-content { padding: 16px; }

    .reports-tab { padding: 8px 0; }
    .report-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .report-actions button { display: flex; align-items: center; gap: 8px; padding: 14px 16px; font-size: 0.8rem; justify-content: center; width: 100%; }
    .report-actions button mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .report-error { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 14px; background: #fef2f2; border-radius: 8px; color: #dc2626; font-size: 0.75rem; }

    .right-sidebar { display: flex; flex-direction: column; gap: 12px; }
    .sidebar-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .sidebar-card mat-card-header { padding: 12px 16px; }
    .sidebar-card mat-card-title { font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .sidebar-card mat-card-title mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .sidebar-card mat-card-content { padding: 0; }
    .sidebar-card mat-card-content.no-padding { padding: 0; }
    .sidebar-card.incidents-card { max-height: 400px; overflow: hidden; display: flex; flex-direction: column; }
    .health-card mat-card-content { padding: 12px 16px 16px; }
    .health-metrics { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .health-item { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; }
    .health-dot { width: 8px; height: 8px; border-radius: 50%; }
    .health-dot.green { background: #10b981; }
    .health-dot.amber { background: #f59e0b; }
    .health-dot.gray { background: #94a3b8; }
    .health-label { flex: 1; color: #475569; }
    .health-value { font-weight: 700; color: #1e293b; font-size: 0.85rem; }
    .fleet-occupancy { padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .section-label { font-size: 0.65rem; font-weight: 600; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 6px; }
    .occupancy-bar { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
    .occupancy-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
    .occupancy-fill.green { background: #10b981; }
    .occupancy-fill.amber { background: #f59e0b; }
    .occupancy-fill.red { background: #ef4444; }
    .occupancy-pct { font-size: 0.65rem; color: #94a3b8; }

    .access-restricted { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 16px; color: #94a3b8; }
    .access-restricted mat-icon { font-size: 28px; width: 28px; height: 28px; opacity: 0.5; }
    .access-restricted p { margin: 0; font-size: 0.8rem; color: #ef4444; font-weight: 600; }
    .restricted-hint { font-size: 0.65rem; color: #94a3b8; text-align: center; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  `],
})
export class TransportDashboardComponent implements OnInit, OnDestroy {
  readonly service = inject(TransportService);
  private authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);

  readonly dashboardData = this.service.dashboardData;
  readonly isLoading = this.service.isLoading;
  readonly error = this.service.error;
  readonly fleetTelemetry = this.service.telemetryUpdates;
  readonly activeTrips = this.service.activeTrips;
  readonly incidents = this.service.incidents;

  readonly searchQuery = signal('');
  readonly reportLoading = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly focusedTripId = signal<string | null>(null);
  readonly selectedTrip = signal<DailyTrip | null>(null);
  readonly manifestOpen = signal(false);
  readonly manifestTrip = signal<DailyTrip | null>(null);

  readonly canViewIncidents = computed(() => {
    if (this.service.incidentsAccessDenied()) return false;
    const permissions = this.authStore.userPermissions();
    return permissions.includes('*') || permissions.includes('transport.view_incidents');
  });

  readonly activeTripCards = computed(() => {
    const trips = this.activeTrips();
    const q = this.searchQuery().toLowerCase();
    if (!q) return trips;
    return trips.filter(t =>
      (t.vehicle_details?.registration_number || '').toLowerCase().includes(q) ||
      (t.route_name || '').toLowerCase().includes(q) ||
      (t.driver_name || '').toLowerCase().includes(q) ||
      (t.conductor_name || '').toLowerCase().includes(q)
    );
  });

  readonly selectedTripTelemetry = computed(() => {
    const trip = this.selectedTrip();
    if (!trip) return null;
    return this.service.getVehicleTelemetry(trip.vehicle);
  });

  readonly onlineVehicles = computed(() =>
    this.fleetTelemetry().filter(t => t.status === 'ON_ROUTE' || t.status === 'IN_TRANSIT').length
  );
  readonly idleVehicles = computed(() =>
    this.fleetTelemetry().filter(t => t.status === 'IDLE' || t.status === 'STOPPED' || t.status === 'DELAYED').length
  );
  readonly offlineVehicles = computed(() => {
    const total = this.dashboardData()?.fleet_summary.total_vehicles || 0;
    return Math.max(0, total - this.fleetTelemetry().length);
  });

  readonly avgOccupancyPct = computed(() => {
    const trips = this.activeTrips();
    if (!trips.length) return 0;
    const total = trips.reduce((sum, t) => {
      const cap = t.vehicle_details?.capacity || 1;
      return sum + Math.min(100, ((t.passenger_count ?? 0) / cap) * 100);
    }, 0);
    return Math.round(total / trips.length);
  });

  readonly avgOccupancyColor = computed(() => {
    const pct = this.avgOccupancyPct();
    if (pct >= 90) return 'red';
    if (pct >= 70) return 'amber';
    return 'green';
  });

  ngOnInit(): void {
    this.loadData();
    this.service.connectWebSocket();
    this.service.startSummaryRefresh();
  }

  ngOnDestroy(): void {
    this.service.disconnectWebSocket();
    this.service.stopSummaryRefresh();
  }

  loadData(): void {
    this.service.getDashboardData().subscribe({
      next: (data) => this.service.setDashboardData(data),
      error: () => undefined,
    });
    this.service.getIncidents({ resolved: false }).subscribe({
      next: (inc) => this.service.incidents.set(inc),
    });
    this.service.getDailyTrips({ status: 'ON_ROUTE' }).subscribe({
      next: (trips) => this.service.activeTrips.set(trips),
    });
  }

  refreshDashboard(): void {
    this.loadData();
  }

  focusTripBy(tripId: string): void {
    if (this.focusedTripId() === tripId) {
      this.focusedTripId.set(null);
      this.selectedTrip.set(null);
      return;
    }
    this.focusedTripId.set(tripId);
    const trip = this.activeTrips().find(t => t.id === tripId);
    if (trip) {
      this.selectedTrip.set(trip);
      const telemetry = this.service.getVehicleTelemetry(trip.vehicle);
      if (telemetry) {
        const mapComponent = document.querySelector('app-fleet-map') as unknown as { flyTo?: (lat: number, lng: number, zoom?: number) => void };
        if (mapComponent?.flyTo) {
          mapComponent.flyTo(Number(telemetry.latitude), Number(telemetry.longitude));
        }
      }
    }
  }

  onMarkerClick(vehicleId: string): void {
    this.snackBar.open(`Tracking vehicle ${vehicleId}`, 'Close', { duration: 3000 });
  }

  openManifest(trip: DailyTrip): void {
    this.manifestTrip.set(trip);
    this.manifestOpen.set(true);
  }

  closeManifest(): void {
    this.manifestOpen.set(false);
  }

  getTripTelemetry(trip: DailyTrip): FleetTelemetry | undefined {
    return this.service.getVehicleTelemetry(trip.vehicle);
  }

  onEmergencyStop(trip: DailyTrip): void {
    const confirmed = confirm(`Emergency stop trip for ${trip.vehicle_details?.registration_number}? This will immediately set the trip status to EMERGENCY_STOP.`);
    if (!confirmed) return;

    this.service.emergencyStopTrip(trip.id).subscribe({
      next: () => {
        this.snackBar.open(`Trip ${trip.vehicle_details?.registration_number} stopped`, 'Close', { duration: 5000 });
        this.loadData();
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Failed to stop trip', 'Close', { duration: 5000 });
      },
    });
  }

  downloadDailyTripLog(): void {
    this.reportLoading.set(true);
    this.reportError.set(null);
    this.service.downloadDailyTripLog('pdf').subscribe({
      next: (blob) => {
        this.reportLoading.set(false);
        this.downloadBlob(blob, 'daily_trip_log.pdf', 'application/pdf');
      },
      error: (err) => { this.reportLoading.set(false); this.reportError.set(err.message); },
    });
  }

  downloadStudentCommuterList(): void {
    this.reportLoading.set(true);
    this.reportError.set(null);
    this.service.downloadStudentCommuterList('xlsx').subscribe({
      next: (blob) => {
        this.reportLoading.set(false);
        this.downloadBlob(blob, 'student_commuter_list.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      },
      error: (err) => { this.reportLoading.set(false); this.reportError.set(err.message); },
    });
  }

  downloadReport(format: 'pdf' | 'xlsx', type: 'fleet_utilization' | 'fuel_maintenance'): void {
    this.reportLoading.set(true);
    this.reportError.set(null);
    this.service.downloadReport(format, type).subscribe({
      next: (blob) => {
        this.reportLoading.set(false);
        const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        this.downloadBlob(blob, `${type}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`, mimeType);
      },
      error: (err) => { this.reportLoading.set(false); this.reportError.set(err.message); },
    });
  }

  private downloadBlob(blob: Blob, filename: string, mimeType: string): void {
    const file = new Blob([blob], { type: mimeType });
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open(`${filename} downloaded`, 'Close', { duration: 3000 });
  }
}

/**
 * Fleet Map Component
 * Transport module - real-time fleet tracking with data table
 */

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WebSocketFleetService } from '../../../../core/services/websocket-fleet.service';
import { TransportService } from '../../services/transport.service';
import { FleetVehicle } from '../../../../shared/models/transport.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-fleet-map',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Transport</h1>
          <p class="subtitle">Fleet Tracking & Live Map</p>
        </div>
        <div class="connection-status" [class.connected]="isConnected()">
          <span class="status-dot"></span>
          {{ isConnected() ? 'Live' : 'Disconnected' }}
        </div>
      </header>

      @if (fleetSummary(); as s) {
        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon vehicles">
                <mat-icon>directions_bus</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ s.total_vehicles }}</span>
                <span class="summary-label">Total Vehicles</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon routes">
                <mat-icon>route</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ s.active_routes }}</span>
                <span class="summary-label">Active Routes</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card" [class.connected]="s.online_count > 0">
            <mat-card-content>
              <div class="summary-icon online">
                <mat-icon>wifi</mat-icon>
              </div>
              <div class="summary-info">
                <span class="summary-value">{{ s.online_count }}</span>
                <span class="summary-label">Online Now</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      @if (transportService.error()) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ transportService.error() }}</span>
        </div>
      }

      <mat-card class="content-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="vehicles()" matSort (matSortChange)="onSort($event)">
              
              <ng-container matColumnDef="vehicle">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Vehicle</th>
                <td mat-cell *matCellDef="let vehicle">
                  <div class="vehicle-info">
                    <span class="vehicle-name">{{ vehicle.name }}</span>
                    <span class="vehicle-reg">{{ vehicle.registration_number }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="route">
                <th mat-header-cell *matHeaderCellDef>Route</th>
                <td mat-cell *matCellDef="let vehicle">{{ vehicle.route?.name || 'Unassigned' }}</td>
              </ng-container>

              <ng-container matColumnDef="driver">
                <th mat-header-cell *matHeaderCellDef>Driver</th>
                <td mat-cell *matCellDef="let vehicle">{{ vehicle.assigned_driver?.full_name || 'Unassigned' }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let vehicle">
                  <app-status-badge [type]="vehicle.is_active ? 'active' : 'inactive'"></app-status-badge>
                </td>
              </ng-container>

              <ng-container matColumnDef="telemetry">
                <th mat-header-cell *matHeaderCellDef>Live Data</th>
                <td mat-cell *matCellDef="let vehicle">
                  @if (getTelemetry(vehicle.id); as telemetry) {
                    <div class="telemetry-info">
                      <span class="speed">{{ telemetry.speed_kmh }} km/h</span>
                      <span class="occupancy">Live tracking active</span>
                    </div>
                  } @else {
                    <span class="no-data">No live data</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-header"></th>
                <td mat-cell *matCellDef="let vehicle" class="actions-cell">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewVehicle(vehicle)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button mat-menu-item (click)="viewRoute(vehicle)">
                      <mat-icon>map</mat-icon>
                      <span>View Route</span>
                    </button>
                    <button mat-menu-item (click)="trackLive(vehicle)">
                      <mat-icon>my_location</mat-icon>
                      <span>Track Live</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row no-data-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="no-data-message">
                    @if (transportService.isLoading()) {
                      <mat-spinner diameter="40"></mat-spinner>
                    } @else {
                      <mat-icon>directions_bus</mat-icon>
                      <p>No vehicles found</p>
                    }
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="transportService.totalCount()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [pageIndex]="currentPage"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .page-header .title-section h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px 0; }
    .page-header .title-section .subtitle { color: #6b7280; margin: 0; }

    .connection-status { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #fee2e2; color: #dc2626; border-radius: 20px; font-size: 14px; font-weight: 500; }
    .connection-status.connected { background: #dcfce7; color: #166534; }
    .connection-status .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .summary-card { border-radius: 12px; }
    .summary-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .summary-card.connected { background: #dcfce7; border: 1px solid #22c55e; }

    .summary-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .summary-icon.vehicles { background: #dbeafe; color: #3b82f6; }
    .summary-icon.routes { background: #f3e8ff; color: #9333ea; }
    .summary-icon.online { background: #dcfce7; color: #16a34a; }
    .summary-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }

    .summary-info { display: flex; flex-direction: column; }
    .summary-value { font-size: 24px; font-weight: 700; color: #1f2937; }
    .summary-label { font-size: 14px; color: #6b7280; }

    .error-alert { display: flex; align-items: center; gap: 8px; padding: 16px; background: #fee2e2; border-radius: 8px; color: #dc2626; margin-bottom: 24px; }
    .content-card { border-radius: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background-color: #f9fafb; }

    .vehicle-info { display: flex; flex-direction: column; }
    .vehicle-info .vehicle-name { font-weight: 500; color: #1f2937; }
    .vehicle-info .vehicle-reg { font-size: 12px; color: #6b7280; }

    .telemetry-info { display: flex; flex-direction: column; }
    .telemetry-info .speed { font-weight: 600; color: #3b82f6; }
    .telemetry-info .occupancy { font-size: 12px; color: #6b7280; }
    .no-data { font-size: 12px; color: #9ca3af; font-style: italic; }

    .actions-header { width: 50px; }
    .actions-cell { text-align: right; }
    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .no-data-message { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #9ca3af; }
    .no-data-message mat-icon { font-size: 48px; width: 48px; height: 48px; }
    mat-paginator { border-top: 1px solid #e5e7eb; }
  `],
})
export class FleetMapComponent implements OnInit, OnDestroy {
  private fleetService = inject(WebSocketFleetService);
  readonly transportService = inject(TransportService);
  private snackBar = inject(MatSnackBar);

  readonly isConnected = this.fleetService.isConnected;
  readonly vehicles = this.transportService.vehicles;
  readonly fleetSummary = this.transportService.fleetSummary;
  readonly displayedColumns = ['vehicle', 'route', 'driver', 'status', 'telemetry', 'actions'];

  currentPage = 0;
  pageSize = 25;

  ngOnInit(): void {
    this.loadVehicles();
    this.transportService.loadFleetSummary();
    this.fleetService.connect();
  }

  ngOnDestroy(): void {
    this.fleetService.disconnect();
  }

  loadVehicles(): void {
    this.transportService.getVehicles(this.currentPage + 1, this.pageSize)
      .subscribe({
        next: (response) => this.transportService.setVehicles(response.results, response.count),
        error: () => {}
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadVehicles();
  }

  onSort(sort: Sort): void { this.loadVehicles(); }

  getTelemetry(vehicleId: number) {
    return this.fleetService.getVehicleTelemetry(vehicleId);
  }

  viewVehicle(vehicle: FleetVehicle): void { this.snackBar.open(`Viewing ${vehicle.registration_number}`, 'Close', { duration: 3000 }); }
  viewRoute(vehicle: FleetVehicle): void { this.snackBar.open(`Viewing route for ${vehicle.registration_number}`, 'Close', { duration: 3000 }); }
  trackLive(vehicle: FleetVehicle): void { this.snackBar.open(`Live tracking ${vehicle.registration_number}`, 'Close', { duration: 3000 }); }
}

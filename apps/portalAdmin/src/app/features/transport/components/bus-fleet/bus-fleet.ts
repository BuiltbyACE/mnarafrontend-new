import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransportService } from '../../services/transport.service';
import type { FleetVehicle, DailyTrip, TripManifest } from '../../../../shared/models/transport.models';
import { VehicleFormDialog } from './vehicle-form-dialog';
import { AssignStudentsDialog } from './assign-students-dialog';

interface BusFleetRow {
  vehicle: FleetVehicle;
  trip: DailyTrip | null;
  studentCount: number;
  students: TripManifest[];
}

@Component({
  selector: 'app-bus-fleet',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="bus-fleet">
      <div class="header-row">
        <span class="title">Registered Buses ({{ vehicles().length }})</span>
        <button mat-raised-button color="primary" (click)="addVehicle()">
          <mat-icon>add</mat-icon> Register Bus
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="28" />
          <span>Loading fleet data...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
          <button mat-button color="primary" (click)="loadAll()">Retry</button>
        </div>
      } @else if (vehicles().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">directions_bus</mat-icon>
          <span class="empty-text">No buses registered yet</span>
          <span class="empty-sub">Register your first bus to get started</span>
          <button mat-stroked-button color="primary" (click)="addVehicle()">
            <mat-icon>add</mat-icon> Register Bus
          </button>
        </div>
      } @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="rows()" class="fleet-table">
            <ng-container matColumnDef="registration">
              <th mat-header-cell *matHeaderCellDef>Registration</th>
              <td mat-cell *matCellDef="let r">
                <div class="cell-primary">{{ r.vehicle.registration_number }}</div>
                <div class="cell-secondary">{{ r.vehicle.model_info || '—' }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="capacity">
              <th mat-header-cell *matHeaderCellDef>Capacity</th>
              <td mat-cell *matCellDef="let r">{{ r.vehicle.capacity }} seats</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <mat-chip [class.active-chip]="r.vehicle.is_active" [class.inactive-chip]="!r.vehicle.is_active" selected>
                  {{ r.vehicle.is_active ? 'Active' : 'Inactive' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="driver">
              <th mat-header-cell *matHeaderCellDef>Driver</th>
              <td mat-cell *matCellDef="let r">
                <span class="cell-primary">{{ r.trip?.driver_name || '—' }}</span>
                <span class="cell-secondary" [class.trip-scheduled]="r.trip?.status === 'SCHEDULED'">
                  {{ r.trip ? (r.trip.status === 'SCHEDULED' ? 'Scheduled' : r.trip.status) : 'No trip' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="conductor">
              <th mat-header-cell *matHeaderCellDef>Conductor</th>
              <td mat-cell *matCellDef="let r">{{ r.trip?.conductor_name || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="students">
              <th mat-header-cell *matHeaderCellDef>Students</th>
              <td mat-cell *matCellDef="let r">
                <span class="cell-primary">{{ r.studentCount }}</span>
                <span class="cell-secondary">{{ r.studentCount === 1 ? 'student' : 'students' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <div class="action-buttons">
                  <button mat-icon-button matTooltip="Assign students" (click)="assignStudents(r)">
                    <mat-icon>person_add</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Edit bus" (click)="editVehicle(r.vehicle)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Delete bus" (click)="deleteVehicle(r.vehicle)">
                    <mat-icon color="warn">delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;" class="fleet-row"></tr>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .bus-fleet { padding: 4px 0; }
    .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .title { font-size: 1rem; font-weight: 600; color: #0f172a; }
    .loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; gap: 12px; color: #64748b; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; }
    .empty-text { font-size: 1rem; font-weight: 500; color: #334155; }
    .empty-sub { font-size: 0.8125rem; color: #94a3b8; }
    .table-wrapper { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .fleet-table { width: 100%; }
    .fleet-row { transition: background 0.15s; }
    .fleet-row:hover { background: #f8fafc; }
    .cell-primary { font-size: 0.875rem; font-weight: 500; color: #0f172a; }
    .cell-secondary { font-size: 0.75rem; color: #94a3b8; }
    .cell-secondary.trip-scheduled { color: #f59e0b; }
    .action-buttons { display: flex; gap: 4px; }
    ::ng-deep .active-chip { --mdc-chip-elevated-container-color: #dcfce7; --mdc-chip-label-text-color: #166534; }
    ::ng-deep .inactive-chip { --mdc-chip-elevated-container-color: #f1f5f9; --mdc-chip-label-text-color: #94a3b8; }
  `],
})
export class BusFleetComponent implements OnInit {
  private transportService = inject(TransportService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly vehicles = signal<FleetVehicle[]>([]);
  readonly trips = signal<DailyTrip[]>([]);
  readonly manifestMap = signal<Map<string, TripManifest[]>>(new Map());

  readonly columns = ['registration', 'capacity', 'status', 'driver', 'conductor', 'students', 'actions'];

  readonly rows = computed<BusFleetRow[]>(() => {
    const v = this.vehicles();
    const t = this.trips();
    const mm = this.manifestMap();
    return v.map((vehicle) => {
      const trip = t.find((tr) => tr.vehicle_details?.id === vehicle.id) || null;
      const manifests = trip ? mm.get(trip.id) || [] : [];
      return { vehicle, trip, studentCount: manifests.length, students: manifests };
    });
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    this.transportService.getVehicles(1, 100).subscribe({
      next: (res) => {
        this.vehicles.set(res.results || []);
        this.loadTrips();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load vehicles');
      },
    });
  }

  private loadTrips(): void {
    this.transportService.getDailyTrips().subscribe({
      next: (trips) => {
        this.trips.set(trips || []);
        this.loadManifests(trips || []);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadManifests(trips: DailyTrip[]): void {
    const activeTrips = trips.filter((t) => t.status === 'ON_ROUTE' || t.status === 'SCHEDULED');
    if (activeTrips.length === 0) {
      this.loading.set(false);
      return;
    }

    let completed = 0;
    const map = new Map<string, TripManifest[]>();
    for (const trip of activeTrips) {
      this.transportService.getManifests(trip.id).subscribe({
        next: (manifests) => {
          map.set(trip.id, manifests || []);
        },
        error: () => map.set(trip.id, []),
        complete: () => {
          completed++;
          if (completed === activeTrips.length) {
            this.manifestMap.set(map);
            this.loading.set(false);
          }
        },
      });
    }
  }

  addVehicle(): void {
    const ref = this.dialog.open(VehicleFormDialog, { data: null, width: '500px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.transportService.createVehicle(result).subscribe({
        next: () => {
          this.snackbar.open('Bus registered successfully', 'Close', { duration: 3000 });
          this.loadAll();
        },
        error: (err) => this.snackbar.open(err.message || 'Failed to register bus', 'Close', { duration: 5000 }),
      });
    });
  }

  editVehicle(vehicle: FleetVehicle): void {
    const ref = this.dialog.open(VehicleFormDialog, { data: vehicle, width: '500px' });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.transportService.updateVehicle(vehicle.id, result).subscribe({
        next: () => {
          this.snackbar.open('Bus updated successfully', 'Close', { duration: 3000 });
          this.loadAll();
        },
        error: (err) => this.snackbar.open(err.message || 'Failed to update bus', 'Close', { duration: 5000 }),
      });
    });
  }

  deleteVehicle(vehicle: FleetVehicle): void {
    if (!confirm(`Delete bus ${vehicle.registration_number}? This cannot be undone.`)) return;
    this.transportService.deleteVehicle(vehicle.id).subscribe({
      next: () => {
        this.snackbar.open('Bus deleted', 'Close', { duration: 3000 });
        this.loadAll();
      },
      error: (err) => this.snackbar.open(err.message || 'Failed to delete bus', 'Close', { duration: 5000 }),
    });
  }

  assignStudents(row: BusFleetRow): void {
    const createTripIfNeeded = (callback: (tripId: string) => void) => {
      if (row.trip) {
        callback(row.trip.id);
      } else {
        const route = prompt('Enter route ID for this bus:');
        if (!route) return;
        this.transportService.createTrip({
          vehicle: row.vehicle.id,
          route: parseInt(route, 10),
          trip_type: 'MORNING',
          status: 'SCHEDULED',
        } as any).subscribe({
          next: (newTrip) => {
            this.snackbar.open('Trip created for this bus', 'Close', { duration: 2000 });
            callback(newTrip.id);
          },
          error: (err) => this.snackbar.open(err.message || 'Failed to create trip', 'Close', { duration: 5000 }),
        });
      }
    };

    createTripIfNeeded((tripId) => {
      const ref = this.dialog.open(AssignStudentsDialog, {
        data: { tripId, vehicleName: row.vehicle.registration_number, existingManifests: row.students },
        width: '520px',
      });

      ref.afterClosed().subscribe((studentIds: number[] | undefined) => {
        if (!studentIds || studentIds.length === 0) return;

        let done = 0;
        for (const sid of studentIds) {
          this.transportService.createManifest({ trip: tripId, student: sid }).subscribe({
            next: () => {
              done++;
              if (done === studentIds.length) {
                this.snackbar.open(`${done} student(s) assigned to bus`, 'Close', { duration: 3000 });
                this.loadAll();
              }
            },
            error: () => {
              done++;
              if (done === studentIds.length) {
                this.snackbar.open('Some students could not be assigned', 'Close', { duration: 4000 });
                this.loadAll();
              }
            },
          });
        }
      });
    });
  }
}

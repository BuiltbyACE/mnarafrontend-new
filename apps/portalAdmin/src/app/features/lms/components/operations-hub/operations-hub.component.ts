import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OperationsService } from '../../services/operations.service';
import { AnnouncementsTableComponent } from '../announcements-table/announcements-table.component';
import { EventsTableComponent } from '../events-table/events-table.component';
import { FacilityBookingsTableComponent } from '../facility-bookings-table/facility-bookings-table.component';
import { IncidentsTableComponent } from '../incidents-table/incidents-table.component';

@Component({
  selector: 'app-operations-hub',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AnnouncementsTableComponent,
    EventsTableComponent,
    FacilityBookingsTableComponent,
    IncidentsTableComponent,
  ],
  template: `
    <div class="hub-container">
      <div class="hub-header">
        <div class="header-content">
          <h1>Operations Hub</h1>
          <p>Manage school events, announcements, facility bookings, and incident logs</p>
        </div>
      </div>

      @if (service.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <mat-tab-group animationDuration="0ms">
          <mat-tab label="Announcements">
            <ng-template matTabContent>
              <app-announcements-table></app-announcements-table>
            </ng-template>
          </mat-tab>

          <mat-tab label="Events Calendar">
            <ng-template matTabContent>
              <app-events-table></app-events-table>
            </ng-template>
          </mat-tab>

          <mat-tab label="Facility Bookings">
            <ng-template matTabContent>
              <app-facility-bookings-table></app-facility-bookings-table>
            </ng-template>
          </mat-tab>

          <mat-tab label="Incident Logs">
            <ng-template matTabContent>
              <app-incidents-table></app-incidents-table>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .hub-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .hub-header {
      margin-bottom: 24px;
    }
    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px;
    }
    .header-content p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    mat-tab-group {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      overflow: hidden;
    }
    ::ng-deep .mat-mdc-tab-body-content {
      padding: 0;
    }
  `],
})
export class OperationsHubComponent implements OnInit {
  readonly service = inject(OperationsService);

  ngOnInit(): void {
    this.service.loadAnnouncements();
    this.service.loadEvents();
    this.service.loadFacilityBookings();
    this.service.loadIncidents();
  }
}

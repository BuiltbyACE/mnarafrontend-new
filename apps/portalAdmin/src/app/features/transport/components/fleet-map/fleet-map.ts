/**
 * Fleet Map Component
 * Transport module - real-time fleet tracking with data table
 */

import { Component, inject, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
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
    <div class="map-command-center">
      <!-- Floating Header Overlay -->
      <div class="map-overlay-header">
        <div class="header-left">
          <mat-icon class="radar-icon">radar</mat-icon>
          <div>
            <h3 class="overlay-title">Live Fleet Tracking</h3>
            <span class="overlay-subtitle">Nairobi Metro Area</span>
          </div>
        </div>
        <div class="header-right">
          <div class="live-badge">
            <div class="pulse-dot"></div>
            Live Sync
          </div>
        </div>
      </div>
      
      <!-- The Map -->
      <div #map id="map"></div>

      <!-- Floating Stats Overlay (Bottom) -->
      <div class="map-overlay-footer">
        <div class="stat-pill">
          <mat-icon>directions_bus</mat-icon>
          <span>Active Routes: <strong>4</strong></span>
        </div>
        <div class="stat-pill warning">
          <mat-icon>speed</mat-icon>
          <span>Speed Alerts: <strong>0</strong></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-command-center {
      position: relative;
      width: 100%;
      height: 600px; /* Taller for better visibility */
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    #map {
      width: 100%;
      height: 100%;
      z-index: 1; /* Keep map below overlays */
      background: #f8fafc; /* Color while tiles load */
    }

    /* Glassmorphism Top Overlay */
    .map-overlay-header {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      z-index: 1000; /* Leaflet UI is usually z-index 400 */
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.5);
    }

    .header-left { display: flex; align-items: center; gap: 12px; }
    .radar-icon { color: #2563eb; }
    .overlay-title { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; line-height: 1.2; }
    .overlay-subtitle { font-size: 0.75rem; color: #64748b; }

    .live-badge {
      background: #ecfdf5;
      color: #059669;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #a7f3d0;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse-ring 1.5s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
    }

    /* Glassmorphism Bottom Overlay */
    .map-overlay-footer {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      gap: 12px;
    }

    .stat-pill {
      background: white;
      padding: 8px 16px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: #334155;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .stat-pill mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
    .stat-pill.warning strong { color: #e11d48; }

    @keyframes pulse-ring {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Clean up Leaflet defaults */
    ::ng-deep .leaflet-control-attribution { display: none; } /* Optional: Hides OSM text for cleaner UI */

    /* Force hardware-accelerated smooth sliding for all map markers */
    ::ng-deep .leaflet-marker-icon {
      transition: transform 0.4s linear !important;
      will-change: transform;
    }
  `],
})
export class FleetMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  private map!: L.Map;
  private markers: { [id: string]: L.Marker } = {};
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

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

    if (isPlatformBrowser(this.platformId)) {
      // Run OUTSIDE Angular to prevent WebSocket updates from freezing the UI
      this.ngZone.runOutsideAngular(() => {
        this.initMap();
        this.listenToFleet();
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Force Leaflet to recalculate bounds after Angular finishes painting the UI
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 250);
    }
  }

  ngOnDestroy(): void {
    this.fleetService.disconnect();
    if (this.map) {
      this.map.remove();
    }
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

  private initMap(): void {
    // Default center: Nairobi, Kenya
    this.map = L.map(this.mapElement.nativeElement).setView([-1.2921, 36.8219], 13);

    // Add CartoDB Voyager tiles (sleek, professional aesthetic - no API key required)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(this.map);
  }

  private listenToFleet(): void {
    // Connect to the WebSocket stream
    this.fleetService.telemetry$.subscribe({
      next: (data: any) => {
        if (data && data.fleet_id && data.latitude && data.longitude) {
          this.updateBusLocation(data);
        }
      },
      error: () => {}
    });
  }

  private updateBusLocation(data: any): void {
    const id = data.fleet_id;
    const lat = data.latitude;
    const lng = data.longitude;
    const status = data.status;

    if (this.markers[id]) {
      // Move existing bus - CSS transition will make this glide smoothly
      this.markers[id].setLatLng([lat, lng]);
      this.markers[id].setPopupContent(`<b>${data.license_plate || 'Bus #' + id}</b><br>Speed: ${data.speed_kmh || 0} km/h<br>Status: ${status || 'Active'}`);
    } else {
      // Create new bus marker with custom HTML DivIcon for pulsing bus dot
      const customIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: '<div style="background:#2563eb; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindPopup(`<b>${data.license_plate || 'Bus #' + id}</b><br>Speed: ${data.speed_kmh || 0} km/h<br>Status: ${status || 'Active'}`)
        .addTo(this.map);

      this.markers[id] = marker;
    }
  }

  viewVehicle(vehicle: FleetVehicle): void { this.snackBar.open(`Viewing ${vehicle.registration_number}`, 'Close', { duration: 3000 }); }
  viewRoute(vehicle: FleetVehicle): void { this.snackBar.open(`Viewing route for ${vehicle.registration_number}`, 'Close', { duration: 3000 }); }
  trackLive(vehicle: FleetVehicle): void { this.snackBar.open(`Live tracking ${vehicle.registration_number}`, 'Close', { duration: 3000 }); }
}

import { Component, inject, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, input, output } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { FleetTelemetry } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-fleet-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      @if (showReconnecting()) {
        <div class="reconnect-bar">
          <div class="reconnect-dot"></div>
          <span>Reconnecting to live fleet...</span>
        </div>
      }
      <div #mapContainer class="map-container"></div>
    </div>
  `,
  styles: [`
    .map-wrapper { position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden; }
    .map-container { width: 100%; height: 100%; background: #f8fafc; }
    .reconnect-bar { position: absolute; top: 12px; left: 12px; right: 12px; z-index: 1000; background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 8px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; font-weight: 500; }
    .reconnect-dot { width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; animation: reconnect-pulse 1s infinite; }
    @keyframes reconnect-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    ::ng-deep .leaflet-control-attribution { display: none; }
    ::ng-deep .custom-bus-marker { background: none; border: none; }
  `],
})
export class FleetMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapElement!: ElementRef;

  readonly telemetryData = input<FleetTelemetry[]>([]);
  readonly showReconnecting = input<boolean>(false);
  readonly focusTripId = input<string | null>(null);
  readonly markerClick = output<string>();

  private map!: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private circleMarkers: Map<string, L.CircleMarker> = new Map();
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initMap(), 100);
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 300);
    }
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [-1.2921, 36.8219],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(this.map);
  }

  updateMarkers(data: FleetTelemetry[]): void {
    if (!this.map) return;

    const seen = new Set<string>();

    for (const t of data) {
      const id = t.vehicle_id?.toString() || t.fleet_id || `bus-${Math.random()}`;
      seen.add(id);
      const lat = Number(t.latitude);
      const lng = Number(t.longitude);
      if (!lat || !lng) continue;

      const color = this.markerColor(t.status);

      if (this.markers.has(id)) {
        this.markers.get(id)!.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-bus-marker',
          html: `
            <div style="
              width:18px; height:18px; border-radius:50%;
              background:${color};
              border:3px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
              transition: all 0.4s linear;
            "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(this.buildPopupContent(t))
          .addTo(this.map);

        marker.on('click', () => this.markerClick.emit(id));
        this.markers.set(id, marker);
      }

      this.markers.get(id)!.setPopupContent(this.buildPopupContent(t));
    }

    for (const [id, marker] of this.markers) {
      if (!seen.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }
  }

  flyTo(lat: number, lng: number, zoom = 15): void {
    if (this.map) {
      this.map.flyTo([lat, lng], zoom, { duration: 1 });
    }
  }

  private markerColor(status?: string): string {
    switch (status) {
      case 'ON_ROUTE': return '#10b981';
      case 'DELAYED': return '#f59e0b';
      case 'STOPPED': return '#ef4444';
      case 'IDLE': return '#94a3b8';
      default: return '#3b82f6';
    }
  }

  private buildPopupContent(t: FleetTelemetry): string {
    const color = this.markerColor(t.status);
    const statusLabel = t.status || 'Unknown';
    return `
      <div style="min-width:180px; font-family:Inter,sans-serif;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>
          <strong style="font-size:0.9rem;">${t.registration_number || 'Bus'}</strong>
        </div>
        <div style="font-size:0.8rem;color:#475569;line-height:1.6;">
          <div><strong>Driver:</strong> ${t.driver_name || 'N/A'}</div>
          <div><strong>Route:</strong> ${t.route_name || 'N/A'}</div>
          <div><strong>Students:</strong> ${t.passenger_count ?? 0}</div>
          <div><strong>Speed:</strong> ${t.speed_kmh ?? 0} km/h</div>
          <div><strong>Status:</strong> ${statusLabel}</div>
        </div>
      </div>`;
  }
}

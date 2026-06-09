import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, inject, input, output, effect, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import maplibregl from 'maplibre-gl';
import { FleetTelemetry, TransportRoute } from '../../models/parent.models';

@Component({
  selector: 'app-parent-fleet-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pmap-wrapper">
      @if (showReconnecting()) {
        <div class="pmap-reconnect-bar">
          <div class="pmap-reconnect-dot"></div>
          <span>Reconnecting to live fleet…</span>
        </div>
      }
      <div #mapContainer class="pmap-container"></div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .pmap-wrapper { position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden; }
    .pmap-container { width: 100%; height: 100%; background: #f8fafc; }
    .pmap-reconnect-bar { position: absolute; top: 12px; left: 12px; right: 12px; z-index: 1000; background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 8px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; font-weight: 500; }
    .pmap-reconnect-dot { width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; animation: pmap-pulse 1s infinite; }
    @keyframes pmap-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    ::ng-deep .maplibregl-popup-content { font-family: Inter, sans-serif; border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    ::ng-deep .maplibregl-popup-close-button { font-size: 16px; padding: 4px 8px; color: #94a3b8; }
  `],
})
export class ParentFleetMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapElement!: ElementRef;

  readonly telemetryData = input<FleetTelemetry[]>([]);
  readonly showReconnecting = input<boolean>(false);
  readonly focusTripId = input<string | null>(null);
  readonly routeCoordinates = input<[number, number][]>([]);
  readonly routesData = input<TransportRoute[]>([]);
  readonly markerClick = output<string>();

  private map!: maplibregl.Map;
  private markers: Map<string, maplibregl.Marker> = new Map();
  private popup: maplibregl.Popup | null = null;
  private platformId = inject(PLATFORM_ID);
  private readonly VEHICLE_SOURCE = 'vehicles';
  private readonly ROUTE_SOURCE = 'route';
  private readonly ROUTES_LINE_SOURCE = 'all-routes';
  private readonly STOPS_SOURCE = 'all-stops';
  private readonly ROUTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  private readonly styleLoaded = signal(false);

  private readonly telemetryEffect = effect(() => {
    const data = this.telemetryData();
    const loaded = this.styleLoaded();
    if (loaded) this.updateVehicleMarkers(data);
  });

  private readonly routeEffect = effect(() => {
    const coords = this.routeCoordinates();
    const loaded = this.styleLoaded();
    if (loaded) this.drawRoute(coords);
  });

  private readonly routesEffect = effect(() => {
    const routes = this.routesData();
    const loaded = this.styleLoaded();
    if (loaded) this.drawAllRoutes(routes);
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initMap(), 100);
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => { if (this.map) this.map.resize(); }, 300);
    }
  }

  ngOnDestroy(): void {
    this.popup?.remove();
    this.markers.forEach((m) => m.remove());
    this.markers.clear();
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = new maplibregl.Map({
      container: this.mapElement.nativeElement,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [36.8219, -1.2921],
      zoom: 12,
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

    this.map.on('load', () => {
      this.map.addSource(this.ROUTE_SOURCE, {
        type: 'geojson',
        lineMetrics: true,
        data: { type: 'FeatureCollection', features: [] },
      });

      this.map.addLayer({
        id: 'route-line',
        type: 'line',
        source: this.ROUTE_SOURCE,
        paint: {
          'line-width': 14,
          'line-gradient': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, 'blue',
            0.1, 'royalblue',
            0.3, 'cyan',
            0.5, 'lime',
            0.7, 'yellow',
            1, 'red',
          ],
          'line-dasharray': [10, 2.4],
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      this.map.addSource(this.VEHICLE_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      this.map.addLayer({
        id: 'vehicles-circle',
        type: 'circle',
        source: this.VEHICLE_SOURCE,
        paint: {
          'circle-radius': 8,
          'circle-color': [
            'match',
            ['get', 'status'],
            'ON_ROUTE', '#10b981',
            'DELAYED', '#f59e0b',
            'STOPPED', '#ef4444',
            'IDLE', '#94a3b8',
            '#3b82f6',
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      this.map.addLayer({
        id: 'vehicles-glow',
        type: 'circle',
        source: this.VEHICLE_SOURCE,
        paint: {
          'circle-radius': 14,
          'circle-color': [
            'match',
            ['get', 'status'],
            'ON_ROUTE', '#10b981',
            'DELAYED', '#f59e0b',
            'STOPPED', '#ef4444',
            'IDLE', '#94a3b8',
            '#3b82f6',
          ],
          'circle-opacity': 0.15,
        },
      });

      this.map.on('click', 'vehicles-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          const id = props?.['vehicle_id'] || props?.['fleet_id'] || '';
          const coords = (e.features[0].geometry as unknown as { coordinates: [number, number] }).coordinates;
          this.markerClick.emit(id);
          this.popup?.remove();
          this.popup = new maplibregl.Popup({ offset: 20 })
            .setLngLat(coords)
            .setHTML(this.buildPopupContent(props))
            .addTo(this.map);
        }
      });

      this.map.on('mouseenter', 'vehicles-circle', () => {
        if (this.map) this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', 'vehicles-circle', () => {
        if (this.map) this.map.getCanvas().style.cursor = '';
      });

      this.map.addSource(this.ROUTES_LINE_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      this.map.addLayer({
        id: 'routes-line-layer',
        type: 'line',
        source: this.ROUTES_LINE_SOURCE,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.7,
          'line-dasharray': [4, 2],
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      this.map.addSource(this.STOPS_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      this.map.addLayer({
        id: 'stops-circle',
        type: 'circle',
        source: this.STOPS_SOURCE,
        paint: {
          'circle-radius': 5,
          'circle-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': ['get', 'color'],
        },
      });

      this.map.addLayer({
        id: 'stops-label',
        type: 'symbol',
        source: this.STOPS_SOURCE,
        layout: {
          'text-field': ['get', 'label'],
          'text-offset': [0, -1.5],
          'text-size': 10,
          'text-anchor': 'bottom',
          'text-optional': true,
        },
        paint: {
          'text-color': '#1e293b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      });

      this.map.on('click', 'stops-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          const coords = (e.features[0].geometry as unknown as { coordinates: [number, number] }).coordinates;
          this.popup?.remove();
          this.popup = new maplibregl.Popup({ offset: 20 })
            .setLngLat(coords)
            .setHTML(this.buildStopPopupContent(props))
            .addTo(this.map);
        }
      });

      this.map.on('mouseenter', 'stops-circle', () => {
        if (this.map) this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', 'stops-circle', () => {
        if (this.map) this.map.getCanvas().style.cursor = '';
      });

      this.styleLoaded.set(true);
    });
  }

  updateMarkers(data: FleetTelemetry[]): void {
    this.updateVehicleMarkers(data);
  }

  flyTo(lat: number, lng: number, zoom = 15): void {
    if (this.map) {
      this.map.flyTo({ center: [lng, lat], zoom, duration: 1000 });
    }
  }

  private drawRoute(coords: [number, number][]): void {
    if (!this.map || !this.styleLoaded()) return;
    const source = this.map.getSource(this.ROUTE_SOURCE) as maplibregl.GeoJSONSource;
    if (!source) return;
    if (coords.length < 2) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      }],
    });
  }

  private updateVehicleMarkers(data: FleetTelemetry[]): void {
    if (!this.map || !this.styleLoaded()) return;
    const source = this.map.getSource(this.VEHICLE_SOURCE) as maplibregl.GeoJSONSource;
    if (!source) return;

    const features: GeoJSON.Feature[] = data
      .filter((t) => t.latitude != null && t.longitude != null)
      .map((t) => ({
        type: 'Feature' as const,
        properties: {
          vehicle_id: t.vehicle_id?.toString() || '',
          fleet_id: t.fleet_id || '',
          status: t.status || 'IDLE',
          registration_number: t.registration_number || 'Bus',
          driver_name: t.driver_name || 'N/A',
          route_name: t.route_name || 'N/A',
          passenger_count: t.passenger_count ?? 0,
          speed_kmh: t.speed_kmh ?? 0,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(t.longitude), Number(t.latitude)],
        },
      }));

    source.setData({ type: 'FeatureCollection', features });

    const activeId = this.focusTripId();
    if (activeId) {
      const target = data.find(
        (t) => t.vehicle_id?.toString() === activeId || t.fleet_id === activeId,
      );
      if (target) {
        this.flyTo(Number(target.latitude), Number(target.longitude));
      }
    }
  }

  private drawAllRoutes(routes: TransportRoute[]): void {
    if (!this.map || !this.styleLoaded()) return;
    const lineSource = this.map.getSource(this.ROUTES_LINE_SOURCE) as maplibregl.GeoJSONSource;
    const stopSource = this.map.getSource(this.STOPS_SOURCE) as maplibregl.GeoJSONSource;
    if (!lineSource || !stopSource) return;

    lineSource.setData({
      type: 'FeatureCollection',
      features: routes.map((route, i) => ({
        type: 'Feature',
        properties: {
          route_id: route.id,
          route_name: route.name,
          color: this.ROUTE_COLORS[i % this.ROUTE_COLORS.length],
        },
        geometry: {
          type: 'LineString',
          coordinates: [...route.stops]
            .sort((a, b) => a.order - b.order)
            .map((s) => [Number(s.longitude), Number(s.latitude)]),
        },
      })),
    });

    const stopFeatures: GeoJSON.Feature[] = [];
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const color = this.ROUTE_COLORS[i % this.ROUTE_COLORS.length];
      for (const stop of route.stops) {
        stopFeatures.push({
          type: 'Feature',
          properties: {
            stop_id: stop.id,
            name: stop.name,
            route_name: route.name,
            order: stop.order,
            color,
            label: stop.name,
            eta: stop.estimated_arrival_offset || '',
          },
          geometry: {
            type: 'Point',
            coordinates: [Number(stop.longitude), Number(stop.latitude)],
          },
        });
      }
    }
    stopSource.setData({ type: 'FeatureCollection', features: stopFeatures });
  }

  private buildPopupContent(props: Record<string, any>): string {
    const status = props?.['status'] || 'Unknown';
    const color = this.markerColor(status);
    return `
      <div style="min-width:180px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>
          <strong style="font-size:0.9rem;">${props?.['registration_number'] || 'Bus'}</strong>
        </div>
        <div style="font-size:0.8rem;color:#475569;line-height:1.6;">
          <div><strong>Driver:</strong> ${props?.['driver_name'] || 'N/A'}</div>
          <div><strong>Route:</strong> ${props?.['route_name'] || 'N/A'}</div>
          <div><strong>Students:</strong> ${props?.['passenger_count'] ?? 0}</div>
          <div><strong>Speed:</strong> ${props?.['speed_kmh'] ?? 0} km/h</div>
          <div><strong>Status:</strong> ${status}</div>
        </div>
      </div>`;
  }

  private buildStopPopupContent(props: Record<string, any>): string {
    return `
      <div style="min-width:160px;">
        <strong style="font-size:0.9rem;">${props['name'] || 'Stop'}</strong>
        <div style="font-size:0.8rem;color:#475569;line-height:1.6;margin-top:4px;">
          <div><strong>Route:</strong> ${props['route_name'] || 'N/A'}</div>
          <div><strong>Order:</strong> Stop #${props['order'] || 0}</div>
          ${props['eta'] ? `<div><strong>ETA:</strong> ${props['eta']}</div>` : ''}
        </div>
      </div>`;
  }

  private markerColor(status: string): string {
    switch (status) {
      case 'ON_ROUTE': return '#10b981';
      case 'DELAYED': return '#f59e0b';
      case 'STOPPED': return '#ef4444';
      case 'IDLE': return '#94a3b8';
      default: return '#3b82f6';
    }
  }
}

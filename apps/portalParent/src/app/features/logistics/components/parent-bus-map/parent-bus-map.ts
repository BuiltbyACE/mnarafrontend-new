import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, inject, input, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import maplibregl from 'maplibre-gl';
import type { TransportRoute, BusTelemetry } from '../../services/parent-transport.service';

@Component({
  selector: 'app-parent-bus-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bus-map-wrapper">
      @if (showReconnecting()) {
        <div class="status-bar reconnecting">
          <div class="status-dot"></div>
          <span>Reconnecting to live feed...</span>
        </div>
      } @else if (wsConnected()) {
        <div class="status-bar live">
          <div class="status-dot live-dot"></div>
          <span>Live</span>
        </div>
      }
      <div #mapContainer class="map-container"></div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .bus-map-wrapper { position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden; }
    .map-container { width: 100%; height: 100%; background: #f1f5f9; }
    .status-bar { position: absolute; top: 12px; left: 12px; z-index: 1000; display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .status-bar.live { background: #dcfce7; color: #166534; }
    .status-bar.reconnecting { background: #fef3c7; color: #92400e; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; }
    .live-dot { background: #22c55e; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentBusMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapElement!: ElementRef;

  readonly routeData = input<TransportRoute | null>(null);
  readonly routesData = input<TransportRoute[]>([]);
  readonly telemetry = input<BusTelemetry | null>(null);
  readonly wsConnected = input(false);
  readonly showReconnecting = input(false);

  private map!: maplibregl.Map;
  private popup: maplibregl.Popup | null = null;
  private platformId = inject(PLATFORM_ID);
  private readonly ROUTE_LINE_SOURCE = 'route-lines';
  private readonly STOPS_SOURCE = 'stops';
  private readonly BUS_SOURCE = 'bus';
  private readonly ROUTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  private readonly styleLoaded = signal(false);

  private readonly routeEffect = effect(() => {
    const routes = this.routesData();
    const single = this.routeData();
    const loaded = this.styleLoaded();
    if (!loaded) return;
    if (routes.length > 0) {
      this.drawAllRoutes(routes);
    } else if (single) {
      this.drawSingleRoute(single);
    }
  });

  private readonly busEffect = effect(() => {
    const t = this.telemetry();
    const loaded = this.styleLoaded();
    if (loaded && t) {
      this.updateBusLocation(t);
    }
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
      this.map.addSource(this.ROUTE_LINE_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      this.map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: this.ROUTE_LINE_SOURCE,
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

      this.map.addSource(this.BUS_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      this.map.addLayer({
        id: 'bus-marker',
        type: 'symbol',
        source: this.BUS_SOURCE,
        layout: {
          'icon-image': 'bus-icon',
          'icon-size': 1.5,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });

      this.map.addLayer({
        id: 'bus-glow',
        type: 'circle',
        source: this.BUS_SOURCE,
        paint: {
          'circle-radius': 16,
          'circle-color': '#3b82f6',
          'circle-opacity': 0.2,
        },
      });

      this.map.on('click', 'stops-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          const coords = (e.features[0].geometry as unknown as { coordinates: [number, number] }).coordinates;
          this.popup?.remove();
          this.popup = new maplibregl.Popup({ offset: 20 })
            .setLngLat(coords)
            .setHTML(`
              <div style="min-width:140px;">
                <strong style="font-size:0.85rem;">${props['name'] || 'Stop'}</strong>
                <div style="font-size:0.75rem;color:#64748b;margin-top:4px;">
                  <div>Route: ${props['route_name'] || ''}</div>
                  <div>Stop #${props['order'] || 0}</div>
                  ${props['eta'] ? `<div><strong>ETA:</strong> ${props['eta']}</div>` : ''}
                </div>
              </div>`)
            .addTo(this.map);
        }
      });

      this.map.on('mouseenter', 'stops-circle', () => {
        if (this.map) this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', 'stops-circle', () => {
        if (this.map) this.map.getCanvas().style.cursor = '';
      });

      const img = new Image(40, 40);
      img.onload = () => {
        if (this.map) {
          this.map.addImage('bus-icon', img);
          this.styleLoaded.set(true);
        }
      };
      img.onerror = () => {
        this.styleLoaded.set(true);
      };
      img.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="4" y="6" width="32" height="28" rx="4" fill="#2563eb" stroke="#1e40af" stroke-width="1.5"/><rect x="8" y="10" width="24" height="14" rx="2" fill="#1e40af"/><rect x="10" y="12" width="6" height="4" rx="1" fill="#60a5fa"/><rect x="18" y="12" width="6" height="4" rx="1" fill="#60a5fa"/><rect x="26" y="12" width="4" height="4" rx="1" fill="#60a5fa"/><circle cx="12" cy="34" r="3" fill="#1e293b"/><circle cx="28" cy="34" r="3" fill="#1e293b"/><rect x="10" y="26" width="20" height="3" rx="1.5" fill="#fbbf24"/></svg>`);
    });
  }

  private drawSingleRoute(route: TransportRoute): void {
    if (!this.map || !this.styleLoaded()) return;
    this.drawAllRoutes([route]);
  }

  private drawAllRoutes(routes: TransportRoute[]): void {
    if (!this.map || !this.styleLoaded()) return;

    const lineSource = this.map.getSource(this.ROUTE_LINE_SOURCE) as maplibregl.GeoJSONSource;
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

  private updateBusLocation(t: BusTelemetry): void {
    if (!this.map || !this.styleLoaded()) return;

    const source = this.map.getSource(this.BUS_SOURCE) as maplibregl.GeoJSONSource;
    if (!source) return;

    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          speed: t.speed_kmh ?? 0,
          status: t.status || 'ON_ROUTE',
        },
        geometry: {
          type: 'Point',
          coordinates: [Number(t.longitude), Number(t.latitude)],
        },
      }],
    });

    if (!this.telemetry()) {
      this.map.flyTo({ center: [Number(t.longitude), Number(t.latitude)], zoom: 13, duration: 1000 });
    }
  }
}

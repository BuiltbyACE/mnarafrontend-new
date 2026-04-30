/**
 * WebSocket Fleet Telemetry Service
 * Real-time fleet tracking via Django Channels
 */

import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, timer } from 'rxjs';
import { retry, delayWhen, takeUntil } from 'rxjs/operators';
import { environment } from '@sms/core/config';
import { TokenStorageService } from '@sms/core/auth';

export interface FleetTelemetry {
  type: 'telemetry_update';
  fleet_id: string;
  license_plate: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  status: 'IN_TRANSIT' | 'IDLE' | 'STOPPED';
  timestamp?: string;
}

export type FleetStatus = 'IN_TRANSIT' | 'IDLE' | 'STOPPED';

@Injectable({
  providedIn: 'root',
})
export class WebSocketFleetService implements OnDestroy {
  private tokenStorage = inject(TokenStorageService);

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_BASE_DELAY = 1000; // 1 second
  private reconnect$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();

  // Signals for reactive updates
  readonly isConnected = signal<boolean>(false);
  readonly connectionError = signal<string | null>(null);
  readonly fleetUpdates = signal<FleetTelemetry[]>([]);

  // Observable for real-time updates
  private telemetrySubject = new Subject<FleetTelemetry>();
  readonly telemetry$ = this.telemetrySubject.asObservable();

  /**
   * Connect to WebSocket fleet endpoint
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const token = this.tokenStorage.getAccessToken();
    if (!token) {
      this.connectionError.set('No authentication token available');
      return;
    }

    // Build WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${environment.apiBaseUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '')}/ws/fleet/live/?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      this.connectionError.set('Failed to establish WebSocket connection');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected.set(false);
    this.reconnectAttempts = 0;
  }

  /**
   * Send ping to keep connection alive
   */
  private startHeartbeat(): void {
    timer(30000, 30000) // Every 30 seconds
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Fleet WebSocket connected');
      this.isConnected.set(true);
      this.connectionError.set(null);
      this.reconnectAttempts = 0;
      this.reconnect$.next(0);
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as FleetTelemetry;

        if (data.type === 'telemetry_update') {
          this.telemetrySubject.next(data);
          this.updateFleetCache(data);
        }
      } catch (error) {
        console.error('Failed to parse fleet telemetry:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Fleet WebSocket error:', error);
      this.connectionError.set('Connection error occurred');
      this.isConnected.set(false);
    };

    this.ws.onclose = (event) => {
      console.log('Fleet WebSocket closed:', event.code, event.reason);
      this.isConnected.set(false);

      // Don't reconnect if intentionally closed
      if (event.code !== 1000 && event.code !== 1001) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.connectionError.set('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    timer(delay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.connect();
      });
  }

  /**
   * Update fleet cache with new telemetry
   */
  private updateFleetCache(update: FleetTelemetry): void {
    const current = this.fleetUpdates();
    const index = current.findIndex(f => f.fleet_id === update.fleet_id);

    if (index >= 0) {
      // Update existing
      const updated = [...current];
      updated[index] = { ...update, timestamp: new Date().toISOString() };
      this.fleetUpdates.set(updated);
    } else {
      // Add new
      this.fleetUpdates.set([...current, { ...update, timestamp: new Date().toISOString() }]);
    }
  }

  /**
   * Get fleet by ID
   */
  getFleetById(fleetId: string): FleetTelemetry | undefined {
    return this.fleetUpdates().find(f => f.fleet_id === fleetId);
  }

  /**
   * Get fleet by status
   */
  getFleetByStatus(status: FleetStatus): FleetTelemetry[] {
    return this.fleetUpdates().filter(f => f.status === status);
  }

  /**
   * Get vehicle telemetry by vehicle/fleet ID
   */
  getVehicleTelemetry(vehicleId: number): FleetTelemetry | undefined {
    return this.fleetUpdates().find(f => f.fleet_id === vehicleId.toString());
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

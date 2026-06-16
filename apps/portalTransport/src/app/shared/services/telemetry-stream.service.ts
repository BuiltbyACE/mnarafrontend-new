import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { getApiUrl, environment } from '@sms/core/config';
import { ConductorApiService } from './conductor-api.service';
import type { TelemetryPayload } from '../models/transport.models';

/**
 * Buffered telemetry entry for offline resilience
 */
interface BufferedTelemetry {
  payload: TelemetryPayload;
  timestamp: number;
  retryCount: number;
}

@Injectable({ providedIn: 'root' })
export class TelemetryStreamService implements OnDestroy {
  private conductorApi = inject(ConductorApiService);

  readonly isStreaming = signal(false);
  readonly lastPosition = signal<GeolocationCoordinates | null>(null);
  readonly error = signal<string | null>(null);
  readonly connectionState = signal<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');

  private ws: WebSocket | null = null;
  private watchId: number | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private shouldReconnect = true;
  private tripId: string | null = null;

  // Offline buffering for resilience on spotty cellular networks
  private buffer: BufferedTelemetry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly BUFFER_FLUSH_INTERVAL = 30_000; // Try to flush every 30s

  // Exponential backoff configuration
  private readonly INITIAL_RECONNECT_DELAY = 2_000;
  private readonly MAX_RECONNECT_DELAY = 30_000;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private reconnectAttempts = 0;
  private currentReconnectDelay = this.INITIAL_RECONNECT_DELAY;

  connect(tripId: string): void {
    this.tripId = tripId;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.currentReconnectDelay = this.INITIAL_RECONNECT_DELAY;
    this.connectionState.set('connecting');
    this.startGpsWatch();
    this.connectWebSocket();
    this.startBufferFlushCycle();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopGpsWatch();
    this.closeWebSocket();
    this.clearTimers();
    this.stopBufferFlushCycle();
    this.isStreaming.set(false);
    this.connectionState.set('disconnected');
    this.lastPosition.set(null);
    this.error.set(null);
    this.tripId = null;
    // Persist buffer to localStorage for crash recovery
    this.persistBuffer();
  }

  /**
   * Get current buffer size for UI display
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Clear the offline buffer
   */
  clearBuffer(): void {
    this.buffer = [];
    this.clearPersistedBuffer();
  }

  private connectWebSocket(): void {
    if (!this.tripId) return;
    this.closeWebSocket();

    const token = this.conductorApi.getDeviceToken();
    if (!token) {
      this.error.set('No authentication token available');
      this.connectionState.set('error');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = environment.apiBaseUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/api\/v1\/?$/, '');
    const wsUrl = `${wsProtocol}//${baseUrl}/ws/transport/trips/${this.tripId}/stream/?token=${token}`;

    this.ws = new WebSocket(wsUrl);
    this.connectionState.set('connecting');

    this.ws.onopen = () => {
      this.isStreaming.set(true);
      this.connectionState.set('connected');
      this.error.set(null);
      this.reconnectAttempts = 0;
      this.currentReconnectDelay = this.INITIAL_RECONNECT_DELAY;
      // Flush any buffered data immediately on reconnect
      this.flushBuffer();
    };

    this.ws.onclose = (event) => {
      this.isStreaming.set(false);
      this.connectionState.set('disconnected');

      // 4001 = auth rejection — don't retry, redirect to login
      if (event.code === 4001) {
        this.error.set('Session expired. Please log in again.');
        this.connectionState.set('error');
        this.conductorApi.clearSession();
        return;
      }

      if (this.shouldReconnect && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        // Exponential backoff with jitter for network resilience
        const jitter = Math.random() * 1000;
        const delay = Math.min(
          this.currentReconnectDelay + jitter,
          this.MAX_RECONNECT_DELAY
        );
        
        this.reconnectTimer = setTimeout(() => {
          this.reconnectAttempts++;
          // Exponential increase: 2s, 4s, 8s, 16s... up to 30s max
          this.currentReconnectDelay = Math.min(
            this.currentReconnectDelay * 2,
            this.MAX_RECONNECT_DELAY
          );
          this.connectWebSocket();
        }, delay);
      } else if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        this.error.set('Max reconnection attempts reached. Please check connection.');
        this.connectionState.set('error');
      }
    };

    this.ws.onerror = (error) => {
      this.error.set('WebSocket connection error');
      this.connectionState.set('error');
      console.error('WebSocket error:', error);
    };
  }

  private closeWebSocket(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000);
      this.ws = null;
    }
  }

  private startGpsWatch(): void {
    if (!navigator.geolocation) {
      this.error.set('GPS not available on this device');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 5_000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.lastPosition.set(pos.coords);
        this.sendPosition(pos.coords);
      },
      (err) => {
        this.error.set(`GPS error: ${err.message}`);
      },
      options,
    );
  }

  private stopGpsWatch(): void {
    if (this.watchId != null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private sendPosition(coords: GeolocationCoordinates): void {
    const payload: TelemetryPayload = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed_kmh: coords.speed != null ? Math.round(coords.speed * 3.6) : 0,
      heading: coords.heading ?? undefined,
      timestamp: new Date().toISOString(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      // Try to send immediately; if buffer exists, flush it first
      if (this.buffer.length > 0) {
        this.flushBuffer();
      }
      this.ws.send(JSON.stringify(payload));
    } else {
      // Buffer for later transmission when connection returns
      this.bufferTelemetry(payload);
    }
  }

  /**
   * Buffer telemetry data when offline
   */
  private bufferTelemetry(payload: TelemetryPayload): void {
    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      // Remove oldest entry to prevent unbounded growth
      this.buffer.shift();
    }
    
    this.buffer.push({
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  /**
   * Start periodic buffer flush attempts
   */
  private startBufferFlushCycle(): void {
    this.flushTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN && this.buffer.length > 0) {
        this.flushBuffer();
      }
    }, this.BUFFER_FLUSH_INTERVAL);
  }

  /**
   * Stop buffer flush cycle
   */
  private stopBufferFlushCycle(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Flush buffered telemetry to server
   */
  private flushBuffer(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.buffer.length === 0) {
      return;
    }

    // Send buffered positions as a batch
    const batch = this.buffer.splice(0, 10); // Send up to 10 at a time
    const batchPayload = {
      type: 'historical_batch',
      positions: batch.map(entry => entry.payload),
      count: batch.length,
    };

    try {
      this.ws.send(JSON.stringify(batchPayload));
    } catch (err) {
      // Put items back in buffer on failure
      this.buffer.unshift(...batch);
      console.error('Failed to flush buffer:', err);
    }
  }

  /**
   * Persist buffer to localStorage for crash recovery
   */
  private persistBuffer(): void {
    try {
      if (this.buffer.length > 0) {
        localStorage.setItem('mnara_telemetry_buffer', JSON.stringify(this.buffer.slice(-20)));
      }
    } catch (e) {
      console.error('Failed to persist buffer:', e);
    }
  }

  /**
   * Clear persisted buffer from localStorage
   */
  private clearPersistedBuffer(): void {
    try {
      localStorage.removeItem('mnara_telemetry_buffer');
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Restore buffer from localStorage on service init
   */
  private restoreBuffer(): void {
    try {
      const saved = localStorage.getItem('mnara_telemetry_buffer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.buffer = parsed;
        }
        localStorage.removeItem('mnara_telemetry_buffer');
      }
    } catch (e) {
      console.error('Failed to restore buffer:', e);
    }
  }

  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  constructor() {
    // Restore any persisted buffer on initialization
    this.restoreBuffer();
  }
}

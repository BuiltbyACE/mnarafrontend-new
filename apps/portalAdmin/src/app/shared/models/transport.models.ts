/**
 * Transport & Fleet Module Models
 */

export interface FleetVehicle {
  id: number;
  fleet_id: string;
  name: string; // Computed from make + model
  registration_number: string; // Alias for license_plate
  license_plate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
  is_active: boolean;
  driver_name?: string;
  route_name?: string;
  route?: { name: string };
  assigned_driver?: { full_name: string };
}

export interface FleetTelemetry {
  type: 'telemetry_update' | 'connection_status';
  fleet_id: string;
  license_plate: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  status: 'IN_TRANSIT' | 'IDLE' | 'STOPPED';
  timestamp?: string;
  heading?: number; // Degrees 0-360
}

export interface Route {
  id: string;
  name: string;
  description: string;
  stops: RouteStop[];
  assigned_vehicle_id?: string;
  is_active: boolean;
}

export interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  scheduled_time: string; // HH:mm format
}

export interface FleetHistoryPoint {
  latitude: number;
  longitude: number;
  speed_kmh: number;
  timestamp: string;
}

export type FleetStatus = 'IN_TRANSIT' | 'IDLE' | 'STOPPED';

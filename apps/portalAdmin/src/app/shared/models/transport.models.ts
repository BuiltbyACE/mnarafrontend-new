export interface FleetVehicle {
  id: number;
  registration_number: string;
  capacity: number;
  model_info: string;
  vin_number: string;
  is_active: boolean;
  current_odometer: string;
}

export interface FleetDevice {
  id: number;
  device_id: string;
  vehicle: number;
  vehicle_name: string;
  pin_code: string;
  is_active: boolean;
  last_ping: string | null;
}

export interface RouteStop {
  id: number;
  route: number;
  name: string;
  order: number;
  latitude: string;
  longitude: string;
  estimated_arrival_offset: string;
}

export interface TransportRoute {
  id: number;
  name: string;
  is_active: boolean;
  stops: RouteStop[];
}

export type TripStatus = 'SCHEDULED' | 'ON_ROUTE' | 'COMPLETED' | 'CANCELLED' | 'EMERGENCY_STOP';
export type TripType = 'MORNING' | 'AFTERNOON';

export interface DailyTrip {
  id: string;
  vehicle: number;
  vehicle_details: FleetVehicle;
  route: number;
  route_name: string;
  route_details: TransportRoute;
  driver: number;
  driver_name: string;
  conductor: number;
  conductor_name: string;
  trip_type: TripType;
  status: TripStatus;
  start_time: string | null;
  end_time: string | null;
  passenger_count: number;
}

export interface TripManifest {
  id: number;
  trip: string;
  student: number;
  student_name: string;
  student_school_id: string;
  stop: number;
  stop_name: string;
  boarded: boolean;
  alighted: boolean;
  timestamp: string;
  drop_off_lat: string | null;
  drop_off_lng: string | null;
}

export type IncidentType = 'BREAKDOWN' | 'TRAFFIC' | 'MEDICAL' | 'DIVERSION';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TripIncident {
  id: number;
  trip: string;
  trip_name: string;
  incident_type: IncidentType;
  severity: Severity;
  description: string;
  resolved: boolean;
}

export interface VehicleMaintenanceLog {
  id: number;
  vehicle: number;
  service_type: string;
  service_date: string;
  odometer_at_service: string;
  cost: string;
  service_provider: string;
  notes: string;
}

export interface VehicleTelemetrySample {
  id: number;
  trip: string;
  latitude: string;
  longitude: string;
  speed_kmh: number;
  timestamp: string;
}

export interface FleetSummary {
  total_vehicles: number;
  active_trips: number;
  maintenance_due: number;
}

export interface FleetTelemetry {
  id?: number;
  fleet_id?: string;
  trip?: string;
  vehicle_id?: number;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  timestamp?: string;
  driver_name?: string;
  route_name?: string;
  passenger_count?: number;
  status?: 'ON_ROUTE' | 'DELAYED' | 'STOPPED' | 'IN_TRANSIT' | 'IDLE';
  registration_number?: string;
}

export interface StudentSafetyStats {
  students_in_transit: number;
  manifest_completion_pct: number;
}

export interface PunctualityIndex {
  on_time_pct: number;
  total_trips: number;
  delayed_trips: number;
}

export interface TransportDashboardData {
  fleet_summary: FleetSummary;
  student_safety: StudentSafetyStats;
  compliance_alerts: number;
  punctuality: PunctualityIndex;
  active_trips: DailyTrip[];
  incidents: TripIncident[];
}

export interface DeviceProvisionResponse {
  device_id: string;
  pin_code: string;
  vehicle: number;
  loginLink?: string;
}

export interface DeviceProvisionRequest {
  pin_code: string;
  vehicle_id: number | null;
}

export interface EmergencyStopResponse {
  status: string;
  trip_id: string;
  timestamp: string;
}

export interface ReportResponse {
  status: string;
  message: string;
  download_url?: string;
}

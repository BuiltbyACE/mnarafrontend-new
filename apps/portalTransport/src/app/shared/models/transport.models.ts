export interface FleetDeviceInfo {
  device_id: string;
  vehicle_id: number;
  registration_number: string;
}

export interface DeviceLoginResponse {
  status: string;
  message: string;
  access_token: string;
  token_type: string;
  device: FleetDeviceInfo;
  current_trip: DailyTrip | null;
}

export interface FleetVehicle {
  id: number;
  registration_number: string;
  capacity: number;
  model_info: string;
  vin_number: string;
  is_active: boolean;
  current_odometer: string;
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
  passengers?: TripManifest[];
}

export interface TripManifest {
  id: number;
  trip: string;
  student: number;
  student_name: string;
  student_first_name: string;
  student_last_name: string;
  student_school_id: string;
  stop: number;
  stop_name: string;
  stop_id: number;
  boarded: boolean;
  alighted: boolean;
  timestamp: string;
  drop_off_lat: string | null;
  drop_off_lng: string | null;
}

export interface TripActionResponse {
  status: string;
  trip_id: string;
  start_time?: string;
  end_time?: string;
  timestamp?: string;
  student?: string;
}

export interface TelemetryPayload {
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading?: number;
  timestamp?: string;
}

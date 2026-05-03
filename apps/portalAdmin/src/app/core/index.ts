/**
 * Admin Portal Core Exports
 */

// Services
export { AdminDashboardService, type DashboardSummary, type DashboardMetrics, type DashboardMetric, type AttendanceOverview, type FeeCollection, type TopClass, type SystemAlert } from './services/admin-dashboard.service';
export { WebSocketFleetService, type FleetTelemetry, type FleetStatus } from './services/websocket-fleet.service';
export { RecentActivitiesService, type Activity, type ActivitiesResponse } from './services/recent-activities.service';
export { CalendarService, type CalendarEvent, type CalendarResponse, type CalendarEventType } from './services/calendar.service';

// Guards
export { GodModeGuard, godModeGuard } from './guards/godmode.guard';

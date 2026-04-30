/**
 * Admin Portal Core Exports
 */

// Services
export { AdminDashboardService, type DashboardSummary, type EnrollmentHealth, type DailyAttendance, type FinancialHealth, type SystemAlert } from './services/admin-dashboard.service';
export { WebSocketFleetService, type FleetTelemetry, type FleetStatus } from './services/websocket-fleet.service';

// Guards
export { GodModeGuard, godModeGuard } from './guards/godmode.guard';

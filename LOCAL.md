🏗️ Mnara ERP Integration & Architecture Report
Date: May 5, 2026
Scope: Frontend-Backend API Integration, Error Handling, and Pagination Standardization.

📌 Fix 001: Environment Configuration (Local Dev Repointing)
Description: Transitioned the Angular MFE from using the remote Ngrok tunnel to the local Django server for direct, latency-free local development and testing.
Error / Context: The frontend was attempting to hit a remote Ngrok tunnel that was either expired or adding unnecessary networking overhead during local dual-boot testing.
Solution: Updated the active environment configuration to route all API calls directly to the local Django port.
Files Affected:

📄 libs/core/config/src/lib/environment.ts

Code Implementation:

TypeScript
export const environment = {
  production: false,
  apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
  authEndpoints: {
    login: '/accounts/auth/login/',
    me: '/accounts/auth/me/',
    refresh: '/accounts/auth/refresh/',
  },
};
📌 Fix 002: Global Error Interceptor Registration & Core Migration
Description: Activated the global HTTP error interceptor. Previously, the adminErrorInterceptorFn was written but never registered in the dependency injection tree, causing the application to silently swallow critical API errors (400 validation failures, 401 un-auths, 500 server crashes).
Error / Context: 1. Silent Failures: Users received zero UI feedback when an API call failed.
2. Nx Workspace Pathing Error: Attempting to import the interceptor from the portalAdmin remote into the shell host using relative paths (./core/...) threw a Cannot find module compiler error because it violated Micro-Frontend boundary rules.
Solution: 1. Relocated the interceptor into the shared @sms/core/auth library.
2. Exported it via the library's index.ts.
3. Registered the functional interceptor globally in the Shell's configuration array alongside the auth interceptor.
Files Affected:

📄 libs/core/auth/src/lib/admin-error.interceptor.ts (New Location)

📄 libs/core/auth/src/index.ts

📄 apps/shell/src/app/app.config.ts

Code Implementation:

TypeScript
import { authInterceptorFn, adminErrorInterceptorFn } from '@sms/core/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptorFn, adminErrorInterceptorFn])),
    // ...other providers
  ],
};
📌 Fix 003: Enforcement of Global DRF Pagination Standard
Description: Standardized the backend API to ensure every list endpoint delivers a consistent pagination envelope.
Error / Context: The /academics/classrooms/ endpoint was breaking the architectural contract by returning a flat JSON array ([{...}]). The Angular data tables expected a paginated envelope containing a results array, causing the tables to silently crash and display "0 of 0".
Solution: Rather than creating technical debt by hacking the frontend RxJS streams, we forced the backend into compliance. Created a custom StandardResultsSetPagination class and registered it globally in the Django settings so all apps instantly conform.
Files Affected:

📄 mnara_school/pagination.py

📄 mnara_school/settings.py

Code Implementation:

Python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'mnara_school.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 25,
}
📌 Fix 004: UI Data Binding & Payload Unwrapping
Description: Aligned the Angular UI components with the newly paginated backend responses and corrected Python-to-TypeScript variable naming mismatches.
Error / Context: Even with successful 200 OK API responses and correct pagination, the Angular tables remained blank. This occurred because:

The services were not unwrapping the .results array from the pagination envelope.

The HTML templates were attempting to bind to camelCase properties (e.g., schoolId), while the backend correctly serves snake_case properties (e.g., user_school_id, first_name).
Solution: Updated the service .pipe() operators to map response.results directly to the components. Refactored the <td mat-cell> template bindings to explicitly use the snake_case keys provided by the Django serializers.
Files Affected:

📄 apps/portalAdmin/.../services/academics.service.ts

📄 apps/portalAdmin/.../services/students.service.ts

📄 apps/portalAdmin/.../students-overview.component.html

Code Implementation:

TypeScript
// Service Unwrapping Example
getStudents(): Observable<StudentProfile[]> {
  return this.http.get<PaginatedResponse<StudentProfile>>(url)
    .pipe(map(response => response.results));
}
HTML
<td mat-cell *matCellDef="let element"> {{ element.first_name }} {{ element.last_name }} </td>
<td mat-cell *matCellDef="let element"> {{ element.user_school_id }} </td>
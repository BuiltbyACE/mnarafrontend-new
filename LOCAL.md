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









📌 Fix 005: Dynamic Dashboard Data Binding & Lifecycle Hooks
Description: Stripped out all hardcoded "Lorem Ipsum" and static UI placeholders across the Admin Portal, replacing them with dynamic, reactive data bindings driven by the backend Analytics APIs.
Error / Context: 1. The Mock Data Trap: The UI was hardcoded with static numbers, dates, and events (e.g., "May 30, 2024 Assembly") preventing real data from surfacing.
2. Missing Import Bug: Adding dynamic loading states introduced an NG8001 compiler error because the <mat-spinner> element was unregistered.
Solution: 1. Refactored the dashboard-page.html to bind directly to the dashboardData() signal, utilizing safe navigation operators (?.) for graceful rendering.
2. Made the global header date and the shell footer copyright year dynamically generated via TypeScript Date APIs.
3. Registered the MatProgressSpinnerModule in the standalone component's import array to resolve the compiler crash.
Files Affected:

📄 .../features/dashboard/components/dashboard-page/dashboard-page.html

📄 .../features/dashboard/components/dashboard-page/dashboard-page.ts

📄 .../layout/admin-header/admin-header.ts

📄 .../core/auth/pages/login-page/login-page.ts

Code Implementation (Spinner Fix):

TypeScript
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, /* other imports */],
  templateUrl: './dashboard-page.html',
})
export class DashboardPageComponent { ... }






Fix 006: Academics Data Grid Overhaul & CRUD Initialization
Description: Refactored the Classrooms data grid in the Admin Portal to correctly parse deep-nested backend JSON and introduced Enterprise-grade UI/UX patterns for CRUD operations.
Error / Context: The initial frontend table was improperly binding to the payload, resulting in concatenated strings (e.g., UnassignedArchived), hiding critical capacity metrics (enrollment_status.current), and lacking interactive action menus for management.
Solution: 1. Re-mapped table columns to isolate name, room_number, and teacher_name.
2. Implemented a reactive Enrollment Widget that reads the backend's is_full boolean to visually alert administrators of classroom capacity limits.
3. Scaffolded the mat-icon-button Actions column (View, Edit, Archive) to prepare for immediate Write/Patch integration.
Files Affected:

📄 apps/portalAdmin/.../classrooms/classrooms-list.component.html

📄 apps/portalAdmin/.../classrooms/classrooms-list.component.ts





📌 Fix 007: Relational Integrity & Seeder Teardown Cascade
Description: Resolved a ProtectedError constraint violation during database teardown and fixed "Ghost Record" generation in the staff seeder.
Error / Context: 1. The Teardown Crash: Running the database seeder with the --clear flag crashed the backend because it attempted to delete TeacherExtension records before deleting the CourseWorkspace records that relied on them (violating on_delete=models.PROTECT).
2. Ghost Teachers: The initial seeder created Teacher and Staff profiles but failed to generate and link the underlying User accounts, resulting in missing first_name and last_name properties on the API payloads.
Solution: 1. Refactored the clear_data() method to strictly enforce a reverse-dependency teardown (Children → Parents → Users).
2. Updated the seed generation loop to ensure atomic creation of a User entity before binding it to a StaffProfile and TeacherExtension.
Files Affected:

📄 accounts/management/commands/seed_db.py







📌 Fix 008: App-Aware Relational Teardown & Multi-Module Cleanup
Description: Engineered a "smart" deletion cascade that dynamically detects installed Django apps and wipes data in a recursive dependency order to satisfy PROTECT foreign key constraints.
Error / Context: 1. Transport Blockage: The seeder was failing because the Transport app's DailyTrip model was shielding User accounts from deletion.
2. Module Coupling: Hard imports of the Transport app caused the seeder to crash if that specific app wasn't in the INSTALLED_APPS list.
Solution: 1. Implemented a safe_delete() utility that verifies model_class._meta.installed before execution.
2. Adopted a Step-0 Destruction strategy: Transport records are now the first to be purged, followed by LMS Workspaces, then Finance, and finally core Identity records.
3. Used dynamic try/except imports to decouple the seeder from specific app dependencies.
Files Affected:

📄 accounts/management/commands/seed_db.py






📌 Fix 009: Sequential Dependency Alignment in Data Seeder
Description: Resolved an UnboundLocalError by re-architecting the seeder's execution order to match the database's relational hierarchy.
Error / Context: The script attempted to instantiate ClassRoom objects (which require a TeacherExtension foreign key) before the Teacher records had been created in the local variable scope.
Solution: 1. Reordered the Seeding Tiers to ensure Staff/Teacher creation (the dependency) occurs before Academic Structure creation (the dependent).
2. Initialized teacher_extensions as an empty list at the handler's entry point as a defensive programming measure.
3. Verified that the teacher_extensions list is now correctly populated and passed into the classroom factory.
Files Affected:

📄 accounts/management/commands/seed_db.py












📌 Fix 010: Student 360-Degree Relational Mapping
Description: Transitioned the student management module from a flat list to a relational "360-degree" profile view.
Error / Context: The Principal had no visibility into student health, family backgrounds, or sibling relationships despite the data existing in the database.
Solution: 1. Backend: Injected a recursive lookup in the StudentProfileSerializer to dynamically identify siblings based on shared carer IDs.
2. Frontend: Implemented an Angular Material Tabbed UI to organize the 14-page admission data into logical clusters (Academic, Medical, Family).
3. Data Binding: Corrected mapping for user_school_id and combined first_name/last_name fields for human-readable display.
Files Affected:

📄 students/serializers.py

📄 apps/portalAdmin/src/app/features/students/...







📌 Fix 011: ORM Prefetch Error & Sibling Query Optimization
Description: Resolved a critical 500 Internal Server Error caused by an invalid prefetch_related call on a non-relational SerializerMethodField.
Error / Context: The system attempted to prefetch admission_record__siblings, which triggered an AttributeError because siblings is a virtual field calculated at runtime, not a database relationship.
Solution: 1. Removed the invalid prefetch from the StudentProfileViewSet.
2. Refactored the get_siblings method in the serializer to use a flat ID lookup on carers, resulting in a more efficient JOIN at the database level.
3. Added an .exclude(id=obj.id) clause to ensure the student is not listed as their own sibling.
Files Affected:

📄 students/views.py

📄 students/serializers.py








📌 Fix 012: Reactive Server-Side Search & Table Hydration
Description: Fixed empty data tables and dead search inputs on the Students Overview page by implementing a reactive RxJS pipeline and enabling DRF search backends.
Error / Context: The Angular Material table was instantiated but never hydrated with the backend results payload. Additionally, the search input was a static HTML element lacking a connection to the backend query parameters.
Solution: 1. Backend: Injected DRF's SearchFilter into the StudentProfileViewSet to allow indexed queries across names and school IDs.
2. Frontend: Bound the search input to an Angular FormControl and piped it through debounceTime(400) and distinctUntilChanged() to optimize network requests.
3. Hydration: Mapped the backend response directly to the MatTableDataSource.data array, instantly populating the grid.
Files Affected:

📄 students/views.py

📄 apps/portalAdmin/.../students-overview.component.ts

📄 apps/portalAdmin/.../students.service.ts









📌 Fix 013: Reactive Form Module Registration & State Declaration
Description: Resolved frontend compiler crashes (NG8002 and TS2339) related to the implementation of the reactive search bar.
Error / Context: 1. The template attempted to bind to [formControl] but the Angular Standalone Component lacked the ReactiveFormsModule dependency.
2. The TypeScript class referenced a searchQuery state variable that was never formally declared.
Solution: 1. Registered ReactiveFormsModule in the component's imports array.
2. Declared the searchQuery string property to store the active search state for pagination/API calls.
Files Affected:

📄 apps/portalAdmin/.../students-overview.component.ts









npx nx serve shell --devRemotes=portalAdmin


npx nx run-many --target=build --all

npx nx serve shell --devRemotes=portalAdmin,portalStudent,portalTeacher


STU-2026-001
omar


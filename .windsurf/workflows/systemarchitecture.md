---
auto_execution_mode: 3
---
ARCHITECTURE BLUEPRINT v1.0
■
SCHOOL MANAGEMENT
SYSTEM
Frontend Architecture Blueprint
Angular · Nx Monorepo · Micro Frontend · Module Federation
Angular 17+ Nx Workspace Module Federation NgRx Signals TypeScript
Confidential — Internal Development Reference
Designed for Angular + Nx + Micro Frontend architecture with Module Federation
School Management System — Frontend Architecture Blueprint Page 2
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
TABLE OF CONTENTS
# Section Page
1 System Overview — Big Picture 3
2 Why Monorepo + Micro Frontend 4
3 Nx Workspace Structure 5
4 The 5 Core Engines 6
5 Portal Architecture — All 5 Portals 7
6 Module Federation Flow 8
7 Complete Data Models 9
8 State Management Strategy 11
9 Senior Dev Recommendation — Where to Start 12
10 Backend Requirements Contract 13
11 Development Roadmap & Timeline 14
School Management System — Frontend Architecture Blueprint Page 3
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
1. SYSTEM OVERVIEW — Big Picture
The School Management System (SMS) is a multi-portal, role-based web application built on an Angular monorepo with Micro
Frontend architecture using Webpack Module Federation. Each user role gets its own independently deployed portal, all
orchestrated by a central Shell host application.
■ Teacher ■ Student ■■■■■ Parent ■ Transport ■■ Admin
■ SHELL APP — Module Federation Host | Auth Router | Layout | Global State
TEACHER
PORTAL
STUDENT
PORTAL
PARENT
PORTAL
TRANSPORT
PORTAL
ADMIN
PORTAL
SHARED LIBRARIES — libs/
■ Auth
Lib
■ HTTP
Engine
■ State
Engine
■ Notif
Engine
■ Shared
UI
■ Models
& Utils
■ BACKEND API — REST / GraphQL | WebSocket | Auth Server | File Storage
PostgreSQL
Database
Redis
Cache
File
Storage (S3)
WebSocket
Server
* Dashed lines = dynamic lazy loading via Module Federation
Figure 1 — Full System Overview: Users → Shell → Portals → Shared Libs → Backend → Data Stores
School Management System — Frontend Architecture Blueprint Page 4
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
2. WHY MONOREPO + MICRO FRONTEND
CONCERN TRADITIONAL APPROACH OUR APPROACH (Monorepo + MFE)
Code sharing npm packages with version hell Nx path aliases — single source of truth
Team scaling One repo = merge conflicts Each portal = independent team, no conflicts
Deployment Deploy everything or nothing Deploy only the changed portal
Performance All users load all code Each portal lazy-loads only what it needs
Testing Full app tests on every change Nx affected — only test what changed
Onboarding Learn the whole system New dev owns one portal and shared libs
Tech upgrades Big bang migration Upgrade one portal at a time
KEY INSIGHT: The monorepo gives you shared models, shared UI, and shared engines — while MFE gives you
independent deployment, team isolation, and portal-level performance budgets. Together, they are the only architecture
that scales this kind of multi-portal system cleanly.
Nx Specifically — Why Not Turborepo?
Nx is the clear winner for Angular MFE. It ships with first-class Angular generators, native Module Federation support, a visual
dependency graph, and the affected command that only runs tasks on code that actually changed. Turborepo is great for
Node/React but lacks the Angular-specific tooling that makes MFE setup a 1-command operation in Nx.
School Management System — Frontend Architecture Blueprint Page 5
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
3. NX WORKSPACE STRUCTURE
school-management — Nx Workspace Structure
school-management/
■■■ apps/
■ ■■■ shell/ ← Host App (MFE Orchestrator)
■ ■ ■■■ src/app/core/auth/
■ ■ ■■■ src/app/core/layout/
■ ■ ■■■ src/app/routes/app.routes.ts
■ ■ ■■■ module-federation.config.ts
■ ■■■ portal-teacher/ ← MFE Remote
■ ■ ■■■ src/app/features/{classes,attendance,grades,timetable}
■ ■ ■■■ module-federation.config.ts
■ ■■■ portal-student/
■ ■ ■■■ src/app/features/{dashboard,grades,assignments,fees}
■ ■■■ portal-parent/
■ ■ ■■■ src/app/features/{children,performance,transport,fees}
■ ■■■ portal-transport/
■ ■ ■■■ src/app/features/{routes,vehicles,drivers,tracking}
■ ■■■ portal-admin/
■ ■■■ src/app/features/{users,school-config,academics,reports}
■
■■■ libs/
■ ■■■ core/ ← THE ENGINES
■ ■ ■■■ auth/ ← Auth Engine
■ ■ ■ ■■■ {auth.service, auth.store, auth.guard, token.service}
■ ■ ■■■ http/ ← HTTP Engine
■ ■ ■ ■■■ {api.service, error.interceptor, loading.interceptor}
■ ■ ■■■ state/ ← State Engine
■ ■ ■ ■■■ {app.store, school.store, notification.store}
■ ■ ■■■ config/
■ ■
■ ■■■ shared/
■ ■ ■■■ models/ ← ALL TypeScript interfaces
■ ■ ■ ■■■ {user, student, teacher, parent, school, academic,
■ ■ ■ attendance, grade, assignment, fee, transport, comms}
■ ■ ■■■ ui/ ← Design System
■ ■ ■ ■■■ {button, table, modal, form-fields, card, charts…}
■ ■ ■■■ utils/
Figure 2 — Full Nx Workspace Directory Tree with annotations
Path Aliases (tsconfig.base.json)
compilerOptions.paths:
@sms/core/auth → libs/core/auth/src/index.ts
@sms/core/http → libs/core/http/src/index.ts
@sms/core/state → libs/core/state/src/index.ts
@sms/shared/models → libs/shared/models/src/index.ts
@sms/shared/ui → libs/shared/ui/src/index.ts
@sms/shared/utils → libs/shared/utils/src/index.ts
@sms/features/teacher→ libs/features/teacher/src/index.ts
School Management System — Frontend Architecture Blueprint Page 6
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
4. THE CORE ENGINES — Mind Map
Six engines live in libs/core/ and libs/shared/. They are consumed by every portal but never modified by portal code. This is
the most critical layer to build first and get right.
CORE
ENGINES
■ AUTH ENGINE
auth.service.ts
auth.store.ts
auth.guard.ts
role.guard.ts
auth.interceptor.ts
token.service.ts
SSO Login Flow
Role Resolver
■ HTTP ENGINE
api.service.ts
error.interceptor.ts
loading.interceptor.ts
retry.strategy.ts
Base URL config
Request queue
■ STATE ENGINE
app.store.ts
school.store.ts
user.store.ts
NgRx Signal Store
Global context
Computed selectors
■ NOTIFICATION ENGINE
notification.store.ts
WebSocket connect
toast.service.ts
Badge counter
Push integration
■■ ROUTING ENGINE Notification types
app.routes.ts
loadRemoteModule()
Role-based redirect
Portal isolation
Deep link support
Route guards
■ UI ENGINE
Design tokens
Button / Table
Modal / Form fields
Charts / Cards
Sidebar / Topbar
Shared pipes
libs/core/ — Consumed by ALL portals via Nx path aliases
Figure 3 — Core Engine Mind Map. All engines are singleton services provided at root.
ENGINE FILES RESPONSIBILITY CONSUMED BY
Auth Engine
auth.service, auth.store,
auth.guard, token.service
Login, JWT, role resolution,
token refresh, SSO
Shell + all portals
HTTP Engine
api.service,
error/loading interceptors
Base URL, Bearer token,
error handling, retry
All feature services
State Engine
app.store, school.store,
notification.store
Global app state, school
context, NgRx Signals
Shell + all portals
Notification Engine
notification.store,
toast.service, ws.service
WebSocket connection,
badge count, toasts
All portals
School Management System — Frontend Architecture Blueprint Page 7
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
Routing Engine
app.routes, role-resolver,
portal.loader
MFE dynamic loading,
role-based redirect
Shell only
UI Engine
Shared component lib,
design tokens
Consistent look & feel,
reusable components
All portals
School Management System — Frontend Architecture Blueprint Page 8
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
5. PORTAL ARCHITECTURE — All 5 Portals
TEACHER PORTAL
■ Classes & Streams
■ Attendance Marking
■ Grade Entry
■ Assignments
■ Timetable View
■ Parent Messaging
STUDENT PORTAL
■ Dashboard
■ My Timetable
■ Grades & Reports
■ Assignments
■ Attendance History
■ Fee Statements
PARENT PORTAL
■ Children Overview
■ Academic Performance
■ Attendance Alerts
■ Transport Tracking
■ Fee Payment
■ Teacher Messages
TRANSPORT PORTAL
■ Route Management
■ Vehicle Fleet
■ Driver Profiles
■ Student Assignments
■ Trip Logs
■ Live Tracking
ADMIN PORTAL
■ User Management
■ School Config
■ Academic Setup
■ Fee Structures
■ Reports & Analytics
■ Announcements
FEATURE LIBRARIES — libs/features/
teacher/ student/ parent/ transport/ admin/
SHARED UI LIBRARY — libs/shared/ui/
Button Table Modal Form Fields Avatar/Badge Card Sidebar Topbar Charts
Every portal is an MFE Remote. Shell loads them at runtime. Zero shared code between portals — only shared libs.
Figure 4 — All portal features, feature libraries, and shared UI layer
School Management System — Frontend Architecture Blueprint Page 9
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
6. MODULE FEDERATION FLOW
MODULE FEDERATION — Runtime Loading Flow
1 User visits
school.app
2 Shell App
Boots
3 Login &
Auth
4 JWT Decoded
Role Extracted
5 Shell Routes
to Portal
Role Switch
TEACHER STUDENT PARENT ADMIN
DRIVER
loadRemoteModule
(portal-teacher)
loadRemoteModule
(portal-student)
loadRemoteModule
(portal-parent)
loadRemoteModule
(portal-admin)
portal-teacher portal-student portal-parent portal-admin
Each portal serves its own remoteEntry.js — Loaded at RUNTIME — Zero coupling
TOKEN STRATEGY
• JWT Access Token (15m)
• Refresh Token (7d)
• HttpOnly Cookie
• Auto-refresh interceptor
• Token stored in memory Figure 5 — Login → Role Resolution → Dynamic Remote Loading flow
module-federation.config.ts — Shell (Host)
module.exports = {
name: "shell",
remotes: {
portalTeacher: "portal-teacher@http://localhost:4201/remoteEntry.js",
portalStudent: "portal-student@http://localhost:4202/remoteEntry.js",
portalParent: "portal-parent@http://localhost:4203/remoteEntry.js",
portalAdmin: "portal-admin@http://localhost:4204/remoteEntry.js",
portalTransport: "portal-transport@http://localhost:4205/remoteEntry.js",
},
shared: { "@angular/core": {singleton:true}, "@angular/router": {singleton:true} }
};
School Management System — Frontend Architecture Blueprint Page 10
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
7. COMPLETE DATA MODELS
School DATA MODEL RELATIONSHIPS
id
name
code
currentTermId
settings{}
AcademicYear
id
schoolId
name
terms[]
isCurrent
Term
id
academicYearId
type
startDate
endDate
Grade
id
schoolId
name
level
streams[]
Stream
id
gradeId
name
classTeacherId
capacity
User
id
firstName
lastName
email
role
schoolId
Student
id
userId
admissionNo
gradeId
streamId
guardians[]
Teacher
id
userId
employeeNo
departmentId
subjectIds[]
Parent
id
userId
children[]
occupation
Subject
id
departmentId
name
code
isCompulsory
Timetable
id
streamId
termId
slots[]
Attendance Session
id
streamId
date
records[]
isLocked
Assignment
id
title
teacherId
subjectId
dueDate
status
Submission
id
assignmentId
studentId
marks
status
ExamResult
id
studentId
subjectId
termId
marks
grade
ReportCard
id
studentId
termId
position
average
isPublished
FeeStructure
id
gradeId
termId
items[]
totalAmount
StudentFee Account
id
studentId
balance
status
payments[]
TransportRoute
id
name
vehicleId
driverId
stops[]
Vehicle
id
plateNo
capacity
driverId
status
All entities extend BaseEntity { id, createdAt, updatedAt, isActive } | schoolId on every entity for multi-tenancy
Figure 6 — Entity Relationship Map. Dashed lines = foreign key references.
Core Enums
UserRole: SUPER_ADMIN | ADMIN | TEACHER | STUDENT | PARENT | DRIVER
AttendanceStatus: PRESENT | ABSENT | LATE | EXCUSED
FeeStatus: UNPAID | PARTIAL | PAID | OVERDUE | WAIVED
PaymentMethod: CASH | BANK_TRANSFER | MPESA | CARD
SubmissionStatus: PENDING | SUBMITTED | LATE | GRADED
AssignmentStatus: DRAFT | PUBLISHED | CLOSED
VehicleStatus: ACTIVE | MAINTENANCE | RETIRED
TermType: TERM_1 | TERM_2 | TERM_3
DayOfWeek: MONDAY | TUESDAY | ... | SATURDAY
BaseEntity (extended by ALL models)
School Management System — Frontend Architecture Blueprint Page 11
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
interface BaseEntity {
id: string; // UUID
createdAt: string; // ISO 8601
updatedAt: string;
isActive: boolean; // soft delete
}
School Management System — Frontend Architecture Blueprint Page 12
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
Key Model Summaries
MODEL KEY FIELDS RELATIONS
User firstName, lastName, email, phone, role, schoolId Base for all personas
Student userId, admissionNumber, gradeId, streamId, guardians[] → User, Grade, Stream, Parent
Teacher userId, employeeNumber, departmentId, subjectIds[] → User, Department, Subject
Parent userId, children[] → User, Student (many)
School name, code, settings{}, currentTermId Root entity, schoolId on everything
AcademicYear schoolId, name, isCurrent, terms[] → School, Term
Grade schoolId, name, level, streams[] → School, Stream
Stream gradeId, name, classTeacherId, capacity → Grade, Teacher
Subject departmentId, name, code, isCompulsory → Department
Timetable streamId, termId, slots[] → Stream, Term
TimetableSlot day, startTime, endTime, subjectId, teacherId → Subject, Teacher
AttendanceSession streamId, date, records[], isLocked → Stream, AttendanceRecord
AttendanceRecord studentId, status, arrivalTime → Student
Assignment title, teacherId, subjectId, streamId, dueDate, status → Teacher, Subject, Stream
Submission assignmentId, studentId, marks, status → Assignment, Student
ExamResult studentId, subjectId, termId, marks, grade → Student, Subject, Term
ReportCard studentId, termId, position, average, isPublished → Student, Term, SubjectResult[]
FeeStructure gradeId, termId, items[], totalAmount → Grade, Term
StudentFeeAccount studentId, termId, balance, status, payments[] → Student, FeePayment[]
FeePayment amount, method, referenceNumber, paymentDate → StudentFeeAccount
Vehicle plateNumber, capacity, driverId, status → Driver
TransportRoute name, vehicleId, driverId, stops[] → Vehicle, Driver
RouteStop name, order, pickupTime, lat, lng → TransportRoute
TripLog routeId, date, tripType, studentsOnboard[] → Route, Vehicle
Notification recipientId, type, title, isRead, actionUrl → User
Announcement authorId, title, targetRoles[], isPinned → School, User
Message threadId, senderId, recipientId, body, isRead → User (2x)
School Management System — Frontend Architecture Blueprint Page 13
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
8. STATE MANAGEMENT STRATEGY
STATE TIER LOCATION WHAT LIVES HERE TOOL
Global (Shell) libs/core/state
UserSession, SchoolContext,
Notifications, Theme
NgRx Signal Store
Portal State
libs/features/<portal>/
data-access
Teacher: classes, timetable
Student: grades, submissions
NgRx Signal Store
Component Local Component class
Form state, UI toggles,
loading booleans
Angular Signals
Server Cache data-access services
API responses, pagination,
filter state
RxJS + Signals
Signal Store Pattern (NgRx Signals)
export const AuthStore = signalStore(
{ providedIn: "root" },
withState({ user: null, token: null, isLoading: false }),
withComputed(({ user }) => ({
isLoggedIn: computed(() => !!user()),
userRole: computed(() => user()?.role),
displayName: computed(() => `${user()?.firstName} ${user()?.lastName}`),
})),
withMethods((store, authService = inject(AuthService)) => ({
async login(creds: LoginCredentials) {
patchState(store, { isLoading: true });
const session = await authService.login(creds);
patchState(store, { user: session.user, token: session.accessToken });
}
}))
);
School Management System — Frontend Architecture Blueprint Page 14
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
9. WHERE TO START — Senior Dev Recommendation
SENIOR DEV RECOMMENDATION — WHERE TO START
01
FOUNDATION
• nx create-workspace
• Configure tsconfig paths
• ESLint + Prettier setup
• Husky pre-commit hooks
• CI/CD pipeline skeleton
02
AUTH ENGINE
• Auth service + store
• JWT interceptor
• Role guard
• Login page (shell)
• Token refresh flow
03
SHELL + MFE
• Module Federation config
• Dynamic route loading
• Portal layout shell
• Shared state setup
• Error boundaries
04
SHARED LIBS
• Design tokens
• UI component lib
• HTTP engine
• All data models
• Shared utils/pipes
05
ADMIN PORTAL
• User management UI
• School config
• Academic year setup
• Fee structure mgmt
• Dashboard & charts
TEACH• Cla• Attend• Gr• Time• AssignTIME →
Start here Week 1–2 Week 2–3 Week 3–4 Week 4–6 Week 6–8 Week 8–10
Figure 7 — Development Fishbone Roadmap. Build bottom-up: foundation → engines → shell → portals.
GOLDEN RULE: Never start with features. Start with the foundation, the engines, and the shell. Every hour spent getting
libs/core/ right saves 10 hours of refactoring later.
Phase-by-Phase Breakdown
PHASE WHAT WHY FIRST DURATION
01 — Foundation
nx create-workspace, ESLint, Husky,
CI skeleton, tsconfig paths
Everything builds on this. Bad config here = pain everywhere. 3–5 days
02 — Auth Engine
AuthService, JWT interceptor,
RoleGuard, TokenService
Nothing works without auth. Build it once, use it everywhere. 3–4 days
03 — Shell + MFE
Module Federation config,
dynamic routes, portal layout
The orchestrator. Portals cannot be built without the shell. 4–5 days
04 — Shared Libs
All models, UI components,
HTTP engine, utils, pipes
Portals import these. Build portals on a solid shared foundation. 5–7 days
05 — Admin Portal
User CRUD, school config,
academic setup, fee structures
Admin creates the data every other portal consumes. Start here. 2–3 weeks
06 — Teacher Portal
Timetable, attendance,
grades, assignments
Teachers generate the core academic data. 2–3 weeks
School Management System — Frontend Architecture Blueprint Page 15
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
07 — Student + Parent
Grade views, submissions,
fee statements, transport track
Read-heavy portals. Build after data-producing portals. 2–3 weeks
08 — Transport Portal
Routes, fleet, tracking,
trip logs, assignments
Most isolated portal. Build last, easiest to parallelize. 1–2 weeks
School Management System — Frontend Architecture Blueprint Page 16
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
10. BACKEND REQUIREMENTS CONTRACT
The frontend team defines this contract. Backend must implement it exactly. Share these models via a shared OpenAPI spec
or a libs/shared/api-contract/ library.
BACKEND REQUIREMENTS — What the Frontend Needs
■ Auth Service
POST /auth/login → { accessToken, refreshToken, user }
POST /auth/refresh → { accessToken }
POST /auth/logout
GET /auth/me → UserSession
JWT payload must include: userId, role, schoolId
Refresh token stored as HttpOnly cookie
■ School & Academic
GET /school/:id → School (with settings)
GET /academic-years?schoolId=&current=true
GET /terms?academicYearId=&current=true
GET /grades?schoolId= → Grade[]
GET /streams?gradeId= → Stream[]
GET /subjects?schoolId= → Subject[]
■■■ Teacher Endpoints
GET /teachers/:id/timetable?termId=
GET /teachers/:id/streams → assigned streams
POST /attendance → AttendanceSession
GET /attendance?streamId=&date=
POST /assignments → Assignment
POST /grades → ExamResult[] (bulk)
■ Student Endpoints
GET /students/:id/timetable
GET /students/:id/attendance?termId=
GET /students/:id/report-card?termId=
GET /students/:id/assignments?status=
POST /submissions → Submission
GET /students/:id/fee-account?termId=
■ Fees Endpoints
GET /fee-structures?gradeId=&termId=
GET /fee-accounts/:studentId?termId=
POST /fee-payments → FeePayment
GET /fee-payments/:id/receipt (PDF)
POST /fee-discounts → FeeDiscount
GET /fee-reports?termId=&schoolId=
■ Transport Endpoints
GET /transport-routes?schoolId=
GET /routes/:id/stops → RouteStop[]
GET /routes/:id/students
POST /trip-logs → TripLog
GET /vehicles?schoolId=
WS /tracking/:routeId → GPS stream
■ Real-time & Comms
WS /notifications/:userId → live stream
GET /notifications?userId=&unread=true
PATCH /notifications/:id/read
GET /announcements?schoolId=&role=
POST /messages → Message
■ Admin Endpoints
POST /users → create any role
GET /users?schoolId=&role=
GET /reports/attendance?termId=
GET /reports/grades?streamId=&termId=
GET /reports/fees?termId=
Frontend contract: All list endpoints return { data: T[], meta: { total, page, pageSize } } | All errors: { code, message, details }
Figure 8 — Backend Endpoints grouped by domain. WS = WebSocket endpoint.
HTTP Response Contract
// All list endpoints
{ data: T[], meta: { total: number, page: number, pageSize: number } }
// All single-entity endpoints
{ data: T }
// All error responses
{ code: string, message: string, details?: Record }
// HTTP Status codes used:
// 200 OK | 201 Created | 400 Validation | 401 Unauth | 403 Forbidden
School Management System — Frontend Architecture Blueprint Page 17
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
// 404 Not Found | 409 Conflict | 422 Unprocessable | 500 Server Error
School Management System — Frontend Architecture Blueprint Page 18
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
11. DEVELOPMENT CHECKLIST — Print & Track
■ FOUNDATION nx create-workspace school-management --preset=angular-monorepo
■ FOUNDATION Configure ESLint, Prettier, Husky pre-commit hooks
■ FOUNDATION Set up CI/CD pipeline (GitHub Actions or Azure DevOps)
■ FOUNDATION Configure tsconfig.base.json path aliases
■ MODELS Create libs/shared/models — all interfaces and enums
■ AUTH ENGINE nx g @nx/angular:lib core/auth
■ AUTH ENGINE Implement AuthService, TokenService, AuthStore (NgRx Signal)
■ AUTH ENGINE Implement AuthInterceptor, RoleGuard, AuthGuard
■ HTTP ENGINE Implement ApiService base class, ErrorInterceptor, LoadingInterceptor
■ STATE ENGINE Implement AppStore, SchoolStore, NotificationStore
■ SHELL APP nx g @nx/angular:app shell --mfe --mfeType=host
■ SHELL APP Configure module-federation.config.ts with all 5 remotes
■ SHELL APP Implement login page, role-based routing, portal layout
■ SHARED UI nx g @nx/angular:lib shared/ui — implement design tokens
■ SHARED UI Build: Button, Table, Modal, FormField, Card, Badge, Avatar
■ SHARED UI Build: Sidebar, Topbar, Charts (wrapper), Notification bell
■ PORTAL SCAFFOLD nx g @nx/angular:app portal-admin --mfe --mfeType=remote
■ PORTAL SCAFFOLD Repeat for: portal-teacher, portal-student, portal-parent, portal-transport
■ ADMIN PORTAL User management (CRUD for all roles)
■ ADMIN PORTAL School configuration, academic year & term setup
■ ADMIN PORTAL Grade & stream management, subject setup
■ ADMIN PORTAL Fee structure management
■ ADMIN PORTAL Reports & analytics dashboard
■ TEACHER PORTAL Timetable view, class list, stream dashboard
■ TEACHER PORTAL Attendance marking (per session)
■ TEACHER PORTAL Grade entry & exam results
■ TEACHER PORTAL Assignment creation & submission review
■ STUDENT PORTAL Dashboard with grades, attendance, upcoming assignments
■ STUDENT PORTAL Assignment submission, timetable, fee statement
■ PARENT PORTAL Multi-child switcher, academic performance view
■ PARENT PORTAL Attendance alerts, fee payment, transport tracking
■ TRANSPORT PORTAL Route CRUD, vehicle & driver management
■ TRANSPORT PORTAL Student-to-route assignment, trip logs, live tracking
■ NOTIFICATIONS WebSocket connection in NotificationEngine
School Management System — Frontend Architecture Blueprint Page 19
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
■ NOTIFICATIONS Toast system, badge counter, notification list
■ POLISH E2E tests (Playwright or Cypress) for critical flows
■ POLISH Performance budgets per portal, Lighthouse CI
■ DEPLOY Docker images per portal, Nginx config for MFE hosting
School Management System — Frontend Architecture Blueprint Page 20
SMS — FRONTEND ARCHITECTURE BLUEPRINT Angular · Nx · Micro Frontend · Module Federation
QUICK REFERENCE — Commands & Key Files
Essential Nx Commands
# Create workspace
npx create-nx-workspace@latest school-management --preset=angular-monorepo
# Add MFE host (shell)
nx g @nx/angular:app shell --mfe --mfeType=host --routing
# Add MFE remote (portal)
nx g @nx/angular:app portal-admin --mfe --mfeType=remote --host=shell
# Generate a library
nx g @nx/angular:lib core/auth --buildable --publishable
# Run only affected apps
nx affected -t build,test,lint
# Visualise dependency graph
nx graph
# Run all portals simultaneously
nx run-many -t serve --projects=shell,portal-admin,portal-teacher
Critical Files Reference
FILE PURPOSE
apps/shell/module-federation.config.ts Declares all remote portals and their URLs
apps/portal-*/module-federation.config.ts Exposes portal routes as ./Routes
libs/shared/models/src/index.ts Single export point for all TypeScript interfaces
libs/core/auth/src/index.ts Single export point for auth engine
tsconfig.base.json Path aliases — @sms/* mappings
nx.json Task pipeline config, caching, affected config
apps/shell/src/app/routes/app.routes.ts Dynamic MFE route loading per role
REMEMBER: Portals never import from each other. They only import from libs/. The shell is the only app that knows
about all portals. This boundary is sacred — enforce it with Nx module boundary rules.
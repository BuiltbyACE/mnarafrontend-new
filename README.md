# Mnara ERP — School Management System

> Angular 21 · Nx 22 · Micro Frontends (Module Federation) · TailwindCSS · Angular Material

A multi-portal school management platform with role-based dashboards for **Admin**, **Teacher**, **Student**, **Parent**, and **Transport** staff. Built as an Nx monorepo with Webpack Module Federation — each portal is an independently deployable micro frontend.

---

## Architecture

```
apps/
├── shell/                  # Host app — auth, layout, route orchestration
├── portalAdmin/            # Admin MFE — users, school config, academics, finance, transport
├── portalTeacher/          # Teacher MFE — classes, attendance, grades, live classes (Zoom)
├── portalStudent/          # Student MFE — grades, assignments, live classes, fee statements
├── portalParent/           # Parent MFE — children overview, fees, transport tracking, academics
├── portalTransport/        # Transport MFE — fleet, routes, drivers, trip logs
├── portalFinance/          # Finance MFE
└── *-e2e/                  # Playwright end-to-end tests per portal

libs/
├── core/
│   ├── auth/               # Auth engine — JWT interceptor, auth guard, token storage
│   ├── config/             # Environment config (API base URL, endpoints)
│   └── state/              # Global state store
└── shared/
    ├── communication/      # Shared messaging/notification services
    ├── models/             # TypeScript interfaces & enums
    ├── services/           # Shared data services
    └── ui/                 # Design system components
```

### Portals

| Portal     | Route           | Port | Description |
|------------|-----------------|------|-------------|
| Shell      | `/`             | 4200 | Auth (2-step login), role-based routing |
| Admin      | `/portalAdmin`  | 4204 | User mgmt, RBAC, academics setup, fee structures, transport dashboard |
| Teacher    | `/portalTeacher`| 4201 | Class streams, attendance, grades, assignments, live classes (Zoom) |
| Student    | `/portalStudent`| 4202 | Dashboard, timetable, grades, assignments, live classes, fees |
| Parent     | `/portalParent` | 4203 | Children overview, fee statement/pay, transport tracking, academics |
| Transport  | `/portalTransport` | 4205 | Fleet mgmt, route planning, driver profiles, GPS tracking |
| Finance    | `/portalFinance`| 4206 | Billing, invoices, transactions, payroll |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components, signals) |
| Monorepo | Nx 22 with Module Federation |
| UI | Angular Material 21 + TailwindCSS 3 |
| State | Angular Signals + RxJS |
| Maps | MapLibre GL JS 5 with OpenFreeMap tiles (free, no API key) |
| PDF | jsPDF (native drawing — no html2canvas) |
| Charts | Chart.js + ng2-charts |
| Live Classes | Zoom (Server-to-Server OAuth) — replaced Jitsi |
| Auth | JWT (access + refresh tokens) |
| Backend | Django 6 + DRF + Channels (REST + WebSocket) at `http://127.0.0.1:8000/api/v1` |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Backend server running at `http://127.0.0.1:8000`

### Install

```bash
npm install
```

### Serve (development)

**All portals at once:**
```bash
npx nx serve shell --devRemotes=portalAdmin,portalTeacher,portalStudent,portalParent,portalTransport,portalFinance
```

**Single portal (faster):**
```bash
npx nx serve shell --devRemotes=portalAdmin
```

### Build

```bash
npx nx run-many --target=build --all
```

### Test

```bash
npx nx run-many --target=test --all
npx nx run-many --target=e2e --all
```

---

## Environment

API base and auth endpoints are configured in `libs/core/config/src/lib/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
  authEndpoints: {
    login: '/accounts/auth/login/',
    me: '/accounts/auth/me/',
    refresh: '/accounts/auth/refresh/',
  },
};
```

---

## Project Conventions

See `best-practices.md` for the full coding standard. Key rules:

- **Standalone components only** (no NgModules) — Angular 21 defaults to standalone
- **Signals** for component state, `computed()` for derived state
- **Native control flow** (`@if`, `@for`) instead of structural directives
- **`input()`/`output()`** functions, not decorators
- **`ChangeDetectionStrategy.OnPush`** on all components
- **No `ngClass`/`ngStyle`** — use `class`/`style` bindings
- **No `@HostBinding`/`@HostListener`** — use the `host` object
- **Paginated API responses** — all list endpoints return `{ count, next, previous, results }`

---

## Key Features Implemented

### Parent Portal
- **Sidebar** — collapsible group headers (Dashboard, My Children, Academics, Fees, Transport, Communication) with chevron rotation and child item indentation
- **Fee Statement** — paginated invoices + transactions tabs, credit balance banner, payment method breakdown, View Online + Download PDF
- **Fee Structure** — price list (categories + total fee only, no paid/balance), PDF download
- **Pay Now** — overpayment/credit card, secure payment channels (M-Pesa, Bank Transfer, Cooperative Bank)
- **Bus Tracking** — real-time MapLibre map with live telemetry, school marker (40px blue circle + permanent "Mnara School" label)
- **Transport Dashboard** — tabs for Dashboard, Device Mgmt, Bus Fleet, Routes & Trip Scheduler, Reports

### Teacher Portal
- **Live Classes** (Zoom) — start class creates Zoom meeting, displays Launch button + meeting ID/password with copy buttons, elapsed timer, End Session
- **Attendance, Grades, Assignments** — CRUD with paginated tables

### Student Portal
- **Live Classes** (Zoom) — join class shows Open Zoom button + meeting ID + password
- **Grades, Assignments, Timetable** — read-only views

### Admin Portal
- **Transport Dashboard** — MapLibre fleet map at Mnara School coordinates, device management, fleet, routes
- **Student 360** — tabbed profile view (Academic, Medical, Family)
- **Classrooms** — enrollment capacity indicator, actions menu
- **User/RBAC management** — role assignment, permissions
- **Search** — debounced server-side search on student overview

### Global
- **Auth** — 2-step login (discover + credentials), JWT interceptor with silent refresh
- **Error handling** — global HTTP error interceptor
- **Pagination** — standardized `StandardResultsSetPagination` across all endpoints
- **Map center** — Mnara School `[36.77805933015456, -1.2822594212716916]`, zoom 15

---

## Important Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **Zoom over Jitsi** | `meet.ffmuc.net` was unreliable. Zoom is ~$15/mo for 1 Pro license + free Server-to-Server OAuth app. Simpler frontend (`window.open` instead of iframe). |
| **MapLibre + OpenFreeMap** | Free, no API key. No usage limits. |
| **Hubs as `<router-outlet />`** | Navigation lives solely in the sidebar. Removing redundant headers/cards keeps routing clean. |
| **Plain `selectedIndex` binding** | Signal-based two-way binding with `mat-tab-group` did not switch content properly. Plain property binding works. |
| **PDF with native jsPDF** | `html2canvas` added complexity and bundle size. Native drawing is more reliable and lightweight. |
| **Fee Structure = price list only** | No `total_paid`/`balance` — it's a catalogue of fee items per term, not a per-student account. |

---

## API Contract

See `plan/admin.md` for the full backend endpoint matrix and payload examples.

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /accounts/auth/login/` | JWT login (school_id/email/phone + password) |
| `GET /accounts/auth/me/` | Current user + portal handshake |
| `GET /finance/fee-structures/` | Fee structure catalogue (categories + total_fee) |
| `GET /finance/invoices/` | Student invoices (paginated) |
| `GET /finance/transactions/` | Payment transactions (paginated) |
| `GET /finance/fee-balances/` | Student fee balances (paginated) |
| `POST /lms/teacher/live-classes/{id}/start/` | Start Zoom meeting |
| `POST /lms/live-classes/{id}/join/` | Join Zoom meeting |
| `WS /tracking/{routeId}/` | Real-time GPS telemetry |
| `GET /analytics/dashboard/summary/` | Dashboard metrics |

---

## Pending / Next Steps

1. **Backend — Zoom integration** — See `apps/portalTeacher/src/app/core/services/backend-zoom-prompt.md` for the full backend spec. The frontend already sends/receives Zoom fields; the backend needs to implement `ZoomService.create_meeting()` and update the VirtualClassroom model with `meeting_id`/`join_url`/`meeting_password`.
2. **Pay Now — live data** — Currently static. Needs dynamic student profiles, fee balances, and M-Pesa account numbers.
3. **RBAC / System Access page** — Consolidated Users, Roles, Permissions tabs with `*appHasPermission` directive.
4. **End-to-end testing** — Live class flow (teacher start → student join → teacher end) once Zoom backend is ready.
5. **Production build** — Docker images per portal, Nginx config for MFE hosting.

---

## Documentation Files

| File | Content |
|------|---------|
| `best-practices.md` | Angular/TypeScript coding standards |
| `plan/admin.md` | Full backend API contract (endpoints, payloads) |
| `LOCAL.md` | Historical fix log (environment setup, pagination, seeder fixes) |
| `apps/portalTeacher/.../backend-zoom-prompt.md` | Backend Zoom integration specification |
| `.windsurf/workflows/systemarchitecture.md` | Original architecture blueprint |
| `.windsurf/plans/mnara-auth-implementation-a4ccb3.md` | Auth implementation plan |
| `apps/shell/src/assets/images/README.md` | Instructions for school building image asset |

---

## Module Federation Configuration

Each portal exposes its routes via a `module-federation.config.ts`. The shell loads them at runtime:

```typescript
// Shell module-federation.config.ts
remotes: {
  portalTeacher:   'portal-teacher@http://localhost:4201/remoteEntry.js',
  portalStudent:   'portal-student@http://localhost:4202/remoteEntry.js',
  portalParent:    'portal-parent@http://localhost:4203/remoteEntry.js',
  portalAdmin:     'portal-admin@http://localhost:4204/remoteEntry.js',
  portalTransport: 'portal-transport@http://localhost:4205/remoteEntry.js',
  portalFinance:   'portal-finance@http://localhost:4206/remoteEntry.js',
}
```

**Important rule:** Portals never import from each other. They only import from `libs/`. The shell is the only app that knows about all portals.

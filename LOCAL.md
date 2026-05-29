# Mnara ERP Integration & Architecture Report

**Date:** May 5, 2026
**Scope:** Frontend-Backend API Integration, Error Handling, and Pagination Standardization.

---

## Fix 001: Environment Configuration (Local Dev Repointing)

Transitioned the Angular MFE from using the remote Ngrok tunnel to the local Django server for direct, latency-free local development.

**Solution:** Updated `libs/core/config/src/lib/environment.ts` to route all API calls to `http://127.0.0.1:8000/api/v1`.

---

## Fix 002: Global Error Interceptor Registration & Core Migration

Activated the global HTTP error interceptor that was written but never registered.

**Solution:** Relocated the interceptor into `@sms/core/auth`, exported via `index.ts`, and registered it in the Shell's `app.config.ts`.

**Files:** `libs/core/auth/src/lib/admin-error.interceptor.ts`, `apps/shell/src/app/app.config.ts`

---

## Fix 003: Enforcement of Global DRF Pagination Standard

Standardized the backend API to deliver a consistent pagination envelope on all list endpoints.

**Solution:** Created `StandardResultsSetPagination` class and registered globally in Django settings.

**Files:** `mnara_school/pagination.py`, `mnara_school/settings.py`

---

## Fix 004: UI Data Binding & Payload Unwrapping

Aligned Angular UI components with paginated backend responses.

**Solution:** Services use `.pipe(map(res => res.results))` to unwrap pagination envelope. Templates bind to snake_case keys.

**Files:** `apps/portalAdmin/.../services/academics.service.ts`, `apps/portalAdmin/.../students.service.ts`

---

## Fix 005: Dynamic Dashboard Data Binding & Lifecycle Hooks

Replaced hardcoded placeholders with dynamic reactive data bindings from Analytics APIs. Added `MatProgressSpinnerModule` import to fix NG8001 compiler error.

**Files:** `apps/portalAdmin/.../dashboard-page.html`, `apps/portalAdmin/.../dashboard-page.ts`, `apps/portalAdmin/.../admin-header.ts`, `apps/portalAdmin/.../login-page.ts`

---

## Fix 006–013: Various Backend & Frontend Fixes

See git history for full details on fixes 006–013 covering:
- **006** — Academics data grid overhaul & CRUD initialization
- **007** — Relational integrity & seeder teardown cascade
- **008** — App-aware relational teardown & multi-module cleanup
- **009** — Sequential dependency alignment in data seeder
- **010** — Student 360-degree relational mapping
- **011** — ORM prefetch error & sibling query optimization
- **012** — Reactive server-side search & table hydration
- **013** — Reactive form module registration & state declaration

---

## Common Commands

```bash
# Serve shell with all portals
npx nx serve shell --devRemotes=portalAdmin,portalStudent,portalTeacher,portalParent,portalTransport,portalFinance

# Serve shell with a single portal
npx nx serve shell --devRemotes=portalAdmin

# Build all apps
npx nx run-many --target=build --all
```

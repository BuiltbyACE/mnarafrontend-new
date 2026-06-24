# Timetable Duplication Report — Cleanup Status

## 1. Removed Duplicate Interfaces

| Location | Interface | Action | Replaced By |
|----------|-----------|--------|-------------|
| `apps/portalTeacher/.../teacher-timetable.service.ts` | `TimetableEntry` | REMOVED | `@sms/domain/timetable` imports |
| `apps/portalTeacher/.../teacher-timetable.service.ts` | `Weekday` | REMOVED | `@sms/domain/timetable` imports |
| `apps/portalStudent/.../timetable.service.ts` | `TimetableLesson` | REMOVED | `@sms/domain/timetable` imports |
| `apps/portalStudent/.../timetable.service.ts` | `TimetableEvent` | REMOVED | `@sms/domain/timetable` imports |
| `apps/portalStudent/.../timetable.service.ts` | `TimetablePayload` | REMOVED | `@sms/domain/timetable` imports |

## 2. Removed Duplicate Services

| Location | Service | Action | Replaced By |
|----------|---------|--------|-------------|
| `apps/portalTeacher/.../teacher-timetable.service.ts` | Raw HttpClient call | REMOVED | `TimetableApiService` from domain |
| `apps/portalStudent/.../timetable.service.ts` | Raw HttpClient call | REMOVED | `TimetableApiService` from domain |

## 3. Files Preserved but Deprecated

| File | Reason for Preservation | Planned Removal |
|------|------------------------|-----------------|
| `libs/frontend/timetable-matrix/src/lib/models/timetable-entry.model.ts` | Admin portal depends on `@sms/frontend/timetable-matrix` | Week 2 |
| `libs/frontend/timetable-matrix/src/lib/models/bell-schedule.model.ts` | Admin portal depends on `@sms/frontend/timetable-matrix` | Week 2 |
| `libs/frontend/timetable-matrix/src/lib/models/live-status.model.ts` | Admin portal depends on `@sms/frontend/timetable-matrix` | Week 2 |
| `libs/frontend/timetable-matrix/src/lib/models/conflict.model.ts` | Admin portal depends on `@sms/frontend/timetable-matrix` | Week 2 |
| `libs/frontend/timetable-matrix/src/lib/services/timetable-api.service.ts` | Admin portal depends on `@sms/frontend/timetable-matrix` | Week 2 |
| `libs/frontend/timetable-matrix/src/lib/services/timetable-state.service.ts` | Admin portal depends on `@sms/frontend/timetable-matrix` | Week 2 |
| `apps/portalParent/.../parent.models.ts` (`TimetableEntry`) | Parent portal not in Week 1 scope | Week 3 |

## 4. Preserved Portal-Specific Code (Non-Duplicate)

The following code is NOT a duplicate — it's portal-specific presentation logic that belongs in each app:

| Portal | File | Purpose |
|--------|------|---------|
| Teacher | `timetable.component.ts` | CSS Grid rendering with FullCalendar strategy |
| Teacher | `calendar-view.component.ts/.html/.css` | Month-picker calendar sidebar |
| Student | `timetable.component.ts` | CSS Grid rendering with current-time indicator |
| Student | `calendar-view.component.ts/.html/.css` | Month-picker calendar sidebar |
| Admin | `timetable-view.page.ts` | Read-only grid view with tabs |
| Admin | `timetable-admin.page.ts` | Admin edit view with conflict checking |
| Admin | `staff-locator.page.ts` | Staff locator dashboard |

## 5. Shared Library → Domain Migration Path

```
Current:
  @sms/frontend/timetable-matrix  →  own models + services + components
  @sms/domain/timetable            →  canonical models + services (NEW)

Target (Week 2+):
  @sms/domain/timetable            →  canonical models + services (single source)
  @sms/frontend/timetable-matrix   →  re-exports from domain + UI components only
  @sms/frontend/timetable-matrix   →  remove own models/services
```

## 6. Current Architecture After Week 1

```
                    ┌────────────────────────────────────┐
                    │      @sms/domain/timetable          │
                    │  (Single Source of Truth)           │
                    │                                     │
                    │  models/  TimetableEntry            │
                    │           TimetableSlot             │
                    │           TimetableEvent            │
                    │           TimetableFilter           │
                    │           TimetableConflict         │
                    │                                     │
                    │  services/ TimetableApiService      │
                    │                                     │
                    │  state/    TimetableStateService    │
                    │                                     │
                    │  mappers/  student-timetable        │
                    │            teacher-timetable        │
                    └────────────────┬───────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
     │   Admin Portal │    │ Teacher Portal │    │ Student Portal │
     │                │    │                │    │                │
     │ Uses           │    │ Uses           │    │ Uses           │
     │ timetable-     │    │ domain models  │    │ domain models  │
     │ matrix lib     │    │ domain service │    │ domain service │
     │ (own models)   │    │ (no local      │    │ (no local      │
     │                │    │  interfaces)   │    │  interfaces)   │
     └────────────────┘    └────────────────┘    └────────────────┘
```

---

*Generated: 2026-06-22*
*Phase 7 deliverable for Timetable Architecture Consolidation Week 1*

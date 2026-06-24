# Timetable Architecture Audit — Final Report

## 1. Executive Summary

The timetable system is implemented across **64 files** spanning the Django backend, an Angular shared library (`timetable-matrix`), and four portal applications (Admin, Teacher, Student, Parent). Despite sharing a backend, the frontend has **three independent timetable implementations** with separate models, services, API contracts, and rendering logic.

**Risk Level:** High — every new feature must be built or fixed 3 times.

---

## 2. Current Architecture

```
                    ┌──────────────────────────────────────┐
                    │          PostgreSQL                   │
                    └──────────┬───────────────────────────┘
                               │
                    ┌──────────▼───────────────────────────┐
                    │     Django Backend (apps/lms/)        │
                    │                                       │
                    │  models/timetable.py  (507 lines)    │
                    │  views/timetable.py   (66 lines)     │
                    │  views/timetable_v2.py (315 lines)   │
                    │  serializers.py (timetable portion)  │
                    │  engine/ (parser, validator, locator, │
                    │          solver)                      │
                    └──────┬──────┬──────┬──────┬──────────┘
                           │      │      │      │
              ┌────────────┤      │      │      ├─────────────┐
              │            │      │      │      │             │
              ▼            ▼      │      │      ▼             ▼
     ┌────────────────┐    ┌──────┴──────┴───────────┐   ┌──────────┐
     │ /lms/timetable │    │  /academics/my-timetable │   │ /lms/    │
     │ /entries/      │    │  /lms/my-timetable/      │   │my-timetable│
     │ /bell-schedules│    │                         │   │          │
     └───────┬────────┘    └──────┬──────────────────┘   └─────┬────┘
             │                    │                            │
             ▼                    ▼                            ▼
     ┌───────────────────┐ ┌─────────────────┐      ┌──────────────────┐
     │ Shared Library    │ │ Teacher Portal  │      │ Student Portal   │
     │ timetable-matrix  │ │                 │      │                  │
     │                   │ │ TimetableEntry  │      │ TimetablePayload │
     │ TimetableEntry    │ │ (local model)   │      │ (local model)    │
     │ BellSchedule      │ │ TimetableData   │      │ TimetableLesson  │
     │ TieredPeriod      │ │ (day→time→entry)│      │ TimetableEvent   │
     │ ConflictReport    │ │                 │      │ (local models)   │
     │                   │ │ API:            │      │                  │
     │ API:              │ │ /academics/     │      │ API:             │
     │ /lms/timetable/*  │ │ my-timetable/   │      │ /lms/            │
     │                   │ │                 │      │ my-timetable/    │
     └────────┬──────────┘ └─────────────────┘      └──────────────────┘
              │
              ▼
     ┌───────────────────┐
     │ Admin Portal      │
     │                   │
     │ TimetableView     │── uses TimetableGridComponent
     │ TimetableAdmin    │── uses TimetableApiService
     │ StaffLocator      │── uses StaffLocatorPanelComponent
     └───────────────────┘
```

---

## 3. Duplicate Code Locations

### 3.1 Timetable Models / Interfaces

| Portal | File | Lines | Model Name | Fields |
|--------|------|-------|------------|--------|
| **Shared Lib** | `libs/frontend/timetable-matrix/.../timetable-entry.model.ts` | 65 | `TimetableEntry` | id, academic_term, day_of_week, day_name, tiered_period, period_name, period_sequence, period_start, period_end, year_group, year_group_name, teacher, teacher_name, subject, subject_code, subject_name, subject_category, room, room_detail, is_practical, practical_rooms, raw_cell_code |
| **Teacher** | `apps/portalTeacher/.../teacher-timetable.service.ts` | 35 | `TimetableEntry` | subject, classroom, teacher? |
| **Student** | `apps/portalStudent/.../timetable.service.ts` | 48 | `TimetableLesson`, `TimetableEvent`, `TimetablePayload` | id, day_of_week, subject_name, teacher_name, room, start_time, end_time, color |
| **Parent** | `apps/portalParent/.../parent.models.ts` | 8 | `TimetableEntry` | day, period, subject, teacher, classroom, start_time, end_time |

**Impact:** Teacher portal stores a flattened `{ [day]: { [time]: entry } }` map. Student portal stores `lessons[] + events[]`. Parent portal uses a 7-field model. None share a common type.

### 3.2 Timetable Services

| Portal | File | API Endpoint | State Pattern |
|--------|------|-------------|---------------|
| **Shared Lib** | `timetable-api.service.ts` | `/lms/timetable/entries/`, `/lms/timetable/entries/week/`, etc. | Signal-based with filters |
| **Shared Lib** | `timetable-state.service.ts` | — | `entries`, `activePeriods`, `selectedDay`, `gridMap`, CRUD methods |
| **Teacher** | `teacher-timetable.service.ts` | `/academics/my-timetable/` | `data`, `isLoading`, `error` signals |
| **Student** | `timetable.service.ts` | `/lms/my-timetable/` | `timetableData`, `isLoading` signals |
| **Parent** | `parent-api.service.ts` | `/academics/my-timetable/` | Observable-based (no cache) |

**Impact:** Teacher fetches once in constructor with no re-fetch mechanism. Student also fetches once. Neither supports filter/term changes. The shared lib's state service is more complete but only used by Admin.

### 3.3 Calendar View Component

| Portal | File | Lines | Similarity |
|--------|------|-------|------------|
| **Teacher** | `apps/portalTeacher/.../calendar-view.component.ts` + `.html` + `.css` | 264 | ~95% identical |
| **Student** | `apps/portalStudent/.../calendar-view.component.ts` + `.html` + `.css` | 264 | ~95% identical |

**Impact:** Two identical month-picker calendar sidebars maintained independently.

### 3.4 Timetable Grid Component

| Portal | Lines | Approach |
|--------|-------|----------|
| **Shared Lib** `timetable-grid.component.ts` | 205 | CDK virtual scrolling, period-based rows, 5-day columns |
| **Teacher** `timetable.component.ts` | 362 | CSS grid, 10 time-slot rows, 5-day columns, hardcoded time strings |
| **Student** `timetable.component.ts` | 272 | CSS grid, 10 time-slot rows, 5-day columns, hardcoded time strings |

**Impact:** Three different grid rendering implementations.

---

## 4. API Endpoint Inventory

| Endpoint | Method | Location | Response Shape | Consumers |
|----------|--------|----------|---------------|-----------|
| `/lms/timetable/entries/` | GET | `timetable_v2.py` | `TimetableEntry[]` | Admin (via shared lib) |
| `/lms/timetable/entries/week/` | GET | `timetable_v2.py` | `WeekViewResponse` (day-grouped map) | Admin (via shared lib) |
| `/lms/timetable/entries/` | POST | `timetable_v2.py` | `TimetableEntry` | Admin (via shared lib) |
| `/lms/timetable/entries/{id}/` | PATCH | `timetable_v2.py` | `TimetableEntry` | Admin (via shared lib) |
| `/lms/timetable/entries/{id}/` | DELETE | `timetable_v2.py` | 204 | Admin (via shared lib) |
| `/lms/timetable/bell-schedules/` | GET | `timetable_v2.py` | `BellSchedule[]` | Admin (via shared lib) |
| `/lms/timetable/tiered-periods/` | GET | `timetable_v2.py` | `TieredPeriod[]` | Admin (via shared lib) |
| `/lms/timetable/rooms/` | GET | `timetable_v2.py` | `Room[]` | Admin (via shared lib) |
| `/lms/timetable/subject-codes/` | GET | `timetable_v2.py` | `SubjectCode[]` | Admin (via shared lib) |
| `/lms/timetable/conflicts/` | GET | `timetable_v2.py` | `ConflictCheckResponse` | Admin (via shared lib) |
| `/lms/timetable/locate/{id}/` | GET | `timetable_v2.py` | `LiveLocatorResponse` | Admin (via shared lib) |
| `/lms/my-timetable/` | GET | `academics/views.py` | `{ events: [], lessons: [] }` | Student |
| `/academics/my-timetable/` | GET | `academics/views.py` | `{ [day]: { [time]: entry } }` | Teacher, Parent |

---

## 5. API Response Shape Divergence

### Shared Lib `TimetableEntry` (from `/lms/timetable/entries/`)
```json
{
  "id": 1,
  "academic_term": 12,
  "day_of_week": 0,
  "day_name": "Monday",
  "tiered_period": 5,
  "period_name": "Period 1",
  "period_sequence": 1,
  "period_start": "08:00",
  "period_end": "08:40",
  "year_group": 3,
  "year_group_name": "Year 3",
  "teacher": 15,
  "teacher_name": "Ms. Smith",
  "subject": 8,
  "subject_code": "MATH",
  "subject_name": "Mathematics",
  "subject_category": "Core",
  "room": 12,
  "room_detail": { "id": 12, "name": "B12", ... },
  "is_practical": false,
  "practical_rooms": "",
  "raw_cell_code": "4MATH"
}
```

### Student `TimetableLesson` (from `/lms/my-timetable/`)
```json
{
  "id": 1,
  "day_of_week": "Monday",
  "subject_name": "Mathematics",
  "teacher_name": "Ms. Smith",
  "room": "B12",
  "start_time": "08:00",
  "end_time": "08:40",
  "color": "#2563eb"
}
```

### Teacher `TimetableData` (from `/academics/my-timetable/`)
```json
{
  "Monday": { "7:30": { "subject": "Mathematics", "classroom": "B12" } },
  "Tuesday": {}
}
```

### Parent `TimetableEntry` (from `/academics/my-timetable/`)
```json
{
  "day": "Monday",
  "period": 1,
  "subject": "Mathematics",
  "teacher": "Ms. Smith",
  "classroom": "B12",
  "start_time": "08:00",
  "end_time": "08:40"
}
```

---

## 6. Shared Library Usage Map

| Export | Admin | Teacher | Student | Parent |
|--------|-------|---------|---------|--------|
| `TimetableEntry` | ✓ | — (own type) | — (own type) | — (own type) |
| `BellSchedule` | ✓ | — | — | — |
| `TieredPeriod` | ✓ | — | — | — |
| `ConflictReport` | ✓ | — | — | — |
| `TimetableApiService` | ✓ | — | — | — |
| `TimetableStateService` | ✓ | — | — | — |
| `LiveTrackerService` | ✓ | — | — | — |
| `TimetableGridComponent` | ✓ | — | — | — |
| `PeriodCellComponent` | ✓ | — | — | — |
| `StaffLocatorPanelComponent` | ✓ | — | — | — |

**Only the Admin portal uses the shared library.**

---

## 7. Teacher Portal Filtering Issue

**File:** `apps/portalTeacher/src/app/features/timetable/timetable.component.ts`

The teacher component has **no filter controls** — no term selector, no year group selector. It calls `fetchTimetable()` once in the constructor with no parameters. The service also has no filter state.

The earlier audit reference to "filteredEntries signal depends on selectedFilters" applies to the **Admin** portal's `TimetableGridComponent` or may reference a planned feature not yet implemented. The teacher portal in its current state simply shows all of the teacher's classes unfiltered.

**Actual risk:** If the backend endpoint `/academics/my-timetable/` returns data for the wrong term or if the teacher has multiple term assignments, there's no way to switch views.

---

## 8. Student Slot Mapping Issue

**File:** `apps/portalStudent/src/app/features/timetable/components/timetable.component.ts:27-38`

```typescript
function nearestSlotIndex(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m;
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < TIME_SLOTS.length; i++) {
    const [sh, sm] = TIME_SLOTS[i].split(':').map(Number);
    const diff = Math.abs(total - (sh * 60 + sm));
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
  }
  return bestIdx;
}
```

**Impact:** A lesson starting at 08:03 would be assigned to the 7:30 slot (closest match). The hardcoded `TIME_SLOTS` array (`['7:30', '8:30', ...]`) also doesn't match the backend's actual period times.

---

## 9. Staff Locator Issue

**File:** `apps/portalAdmin/src/app/features/timetable/pages/staff-locator/staff-locator.page.ts:42-46`

```typescript
this.teachers.set([
  { id: 1, name: 'Teacher 1' },
  { id: 2, name: 'Teacher 2' },
]);
```

**Impact:** Hardcoded mock data. No API call to fetch teacher list. Campus Overview area is a placeholder.

---

## 10. Refactoring Recommendations

| Priority | Recommendation | Effort | Risk |
|----------|---------------|--------|------|
| P0 | Create `libs/domain/timetable` as single source of truth for models | 1 day | Low |
| P0 | Remove duplicated timetable interfaces from Teacher, Student, Parent | 1 day | Medium |
| P1 | Create mapper layer for backend response → canonical models | 1 day | Low |
| P1 | Unify Teacher & Student API calls into shared `TimetableApiService` | 1 day | Medium |
| P1 | Fix student slot mapping to use `tiered_period` ID instead of heuristics | 0.5 day | Low |
| P2 | Replace hardcoded staff locator with live API data | 1 day | Low |
| P2 | Add calendar month-picker to shared library and remove duplicates | 1 day | Low |
| P3 | Implement term/teacher/year-group filtering in teacher portal | 1 day | Low |
| P3 | Create unified `/api/timetable/{role}` endpoints | 2 days | High |

---

## 11. Dependency Diagram

```
                          ┌───────────────────────────────┐
                          │         PostgreSQL            │
                          └──────────┬────────────────────┘
                                     │
                          ┌──────────▼────────────────────┐
                          │     Django Backend             │
                          │     (apps/lms/models/)         │
                          │                               │
                          │  TimetableEntry (canonical)    │
                          │  BellSchedule                  │
                          │  TieredPeriod                  │
                          │  Room                          │
                          │  SubjectCode                   │
                          └──────────┬────────────────────┘
                                     │
                          ┌──────────▼────────────────────┐
                          │     Django Views               │
                          │                               │
                          │  TimetableEntryViewSet         │
                          │  BellScheduleViewSet           │
                          │  TieredPeriodViewSet           │
                          │  RoomViewSet                   │
                          │  SubjectCodeViewSet            │
                          │  ConflictCheckView             │
                          │  LiveLocatorView               │
                          │  StudentUnifiedTimetableView   │
                          │  TeacherTimetableView          │
                          └──────┬──────┬──────┬───────────┘
                                 │      │      │
                    ┌────────────┤      │      ├─────────┐
                    │            │      │      │         │
                    ▼            ▼      │      ▼         ▼
        ┌─────────────────┐  ┌──────────┴──────┴──────────┐  ┌──────────────┐
        │  /lms/timetable │  │  /academics/my-timetable   │  │ /lms/        │
        │  /entries/      │  │  /lms/my-timetable        │  │my-timetable/ │
        └────────┬────────┘  └──────────┬─────────────────┘  └──────┬───────┘
                 │                      │                          │
                 ▼                      ▼                          ▼
        ┌───────────────────────────────────────────────────────────────┐
        │               libs/domain/timetable (NEW)                      │
        │                                                                 │
        │  models/   timetable-entry.model.ts (canonical)                │
        │            timetable-slot.model.ts                              │
        │            timetable-event.model.ts                             │
        │            timetable-filter.model.ts                            │
        │            timetable-conflict.model.ts                          │
        │                                                                 │
        │  mappers/  student-timetable.mapper.ts                          │
        │            teacher-timetable.mapper.ts                          │
        │                                                                 │
        │  services/ timetable-api.service.ts (unified)                  │
        │            timetable-state.service.ts (unified)                │
        │                                                                 │
        │  contracts/ api-contracts.ts                                    │
        └──────────────────┬────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────────┐
            │              │                  │
            ▼              ▼                  ▼
   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
   │   Admin Portal │  │ Teacher Portal │  │ Student Portal │
   │                │  │                │  │                │
   │ All imports    │  │ Removed local  │  │ Removed local  │
   │ from domain    │  │ models         │  │ models         │
   │ already via    │  │ Now imports    │  │ Now imports    │
   │ timetable-     │  │ from domain    │  │ from domain    │
   │ matrix lib    │  │                │  │                │
   └────────────────┘  └────────────────┘  └────────────────┘
```

---

## 12. File Count Summary

| Category | Count |
|----------|-------|
| Backend models | 2 |
| Backend views | 3 |
| Backend serializers | 1 |
| Backend URLs | 2 |
| Backend engine | 5 |
| Backend management commands | 3 |
| Backend migrations | 5 |
| Backend other | 2 |
| Shared lib models | 4 |
| Shared lib services | 3 |
| Shared lib components | 4 |
| Admin portal | 6 |
| Teacher portal | 7 |
| Student portal | 9 |
| Parent portal | 1 |
| Documentation | 3 |
| Config | 2 |
| **Total** | **64** |

---

*Generated: 2026-06-22*
*Phase 1 deliverable for Timetable Architecture Consolidation Week 1*

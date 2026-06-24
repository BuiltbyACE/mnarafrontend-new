# Week 3 Validation Report — Conflict Detection Engine

## Summary

Built a centralized scheduling intelligence layer with real-time conflict detection across 6 dimensions.

## Deliverables

### Backend

| File | Purpose |
|---|---|
| `apps/lms/models/timetable.py` (TeacherAvailability) | New model for teacher availability windows |
| `apps/lms/migrations/0018_teacheravailability.py` | Migration for the new model |
| `apps/lms/services/timetable/conflict_types.py` | Typed dataclasses: `ConflictReport`, `ValidationResult` |
| `apps/lms/services/timetable/validators.py` | 6 validator functions (teacher, class, room, availability, capacity, protected block) |
| `apps/lms/services/timetable/conflict_engine.py` | `ConflictEngine` class with `validate_entry()`, `run_full_check()`, `check_bulk()` |
| `apps/lms/views/timetable_v2.py` | Added `ValidateEntryView`, `BulkCheckView` |
| `apps/lms/tests/conftest.py` | 7 fixtures for test setup |
| `apps/lms/tests/test_conflict_engine.py` | 25 tests covering all validator functions + API endpoints |

### Frontend

| File | Change |
|---|---|
| `libs/domain/timetable/.../timetable-conflict.model.ts` | Added `ROOM`, `AVAILABILITY`, `CAPACITY` conflict types |
| `libs/frontend/timetable-matrix/.../conflict.model.ts` | Same type extension |
| `libs/domain/timetable/.../timetable-api.service.ts` | Added `validateEntry()`, `checkBulk()` methods |
| `apps/portalAdmin/.../timetable-admin.page.ts` | Rich conflict report tab with type grouping, severity badges |

### Documentation

| File | Purpose |
|---|---|
| `docs/architecture/timetable-conflict-audit.md` | Audit of existing vs. target architecture |

## Conflict Detection Coverage

| Check | Type | Severity | Previously Existed |
|---|---|---|---|
| Teacher double-booking | `TEACHER` | ERROR | ✅ `validators.py` |
| Class double-booking | `YEAR_GROUP` | ERROR | ✅ `validators.py` |
| Room double-booking | `ROOM` | ERROR | ❌ NEW |
| Protected block violation | `PROTECTED_BLOCK` | ERROR | ✅ `validators.py` |
| Teacher availability | `AVAILABILITY` | WARNING | ❌ NEW |
| Room capacity | `CAPACITY` | WARNING | ❌ NEW |

## API Surface

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/lms/timetable/conflicts/?term=<id>` | Full term conflict check (enhanced) |
| `POST` | `/lms/timetable/validate/` | Single entry validation |
| `POST` | `/lms/timetable/check-bulk/` | Bulk draft validation |

## Tests

25 tests across 8 test classes covering:
- Teacher conflicts (3 tests)
- Class conflicts (2 tests)
- Room conflicts (4 tests)
- Protected block (2 tests)
- Availability (4 tests)
- Capacity (3 tests)
- `validate_entry` (3 tests)
- `run_full_check` (3 tests)
- `check_bulk` (2 tests)
- API endpoint integration (4 tests)

## Open Items

1. Teacher Availability admin UI — needs a dedicated page to manage availability windows
2. Capacity validation uses concurrent-lessons count as proxy for actual enrolment; should use real `StudentEnrollment` count
3. Performance — O(n²) overlap loops fine for ≤500 entries/day; DB-level query optimisation recommended at larger scale
4. `Conflict` persistence model exists but is not used by the new engine; engines output `ConflictReport` dataclasses only

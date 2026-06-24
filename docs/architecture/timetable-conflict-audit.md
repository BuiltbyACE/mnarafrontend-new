# Timetable Conflict Detection — Audit & Plan

## Current State (June 2026)

### What exists today

| Layer | Status | Notes |
|---|---|---|
| `TimetableEntry.clean()` | ✅ | Teacher double-booking, year-group double-booking, protected-block guard, `select_for_update` |
| `engine/validators.py` | ✅ | `check_teacher_conflicts`, `check_year_group_conflicts`, `check_protected_block_violations`, `run_full_conflict_check` |
| `ConflictCheckView` (GET) | ✅ | Runs `run_full_conflict_check` for a given term |
| `Room.capacity` field | ✅ | Exists but **never validated** |
| Teacher availability model | ❌ | Missing — no way to enforce teacher schedule |
| Room conflict detection | ❌ | Missing — two classes can share the same room at the same time |
| Capacity warnings | ❌ | Missing — class can exceed room capacity |
| Single-entry validation | ❌ | Missing — no `POST /validate` endpoint |
| Bulk validation | ❌ | Missing — no `POST /check-bulk` endpoint |

### Existing validators (apps/lms/engine/validators.py)

All three functions take a `date` and `term` and run O(n²) overlap checks:

1. **`check_teacher_conflicts`** — finds entries where the same teacher_id appears in overlapping TieredPeriods on the same date
2. **`check_year_group_conflicts`** — finds entries where the same year_group appears in overlapping periods on the same date
3. **`check_protected_block_violations`** — finds entries assigned to TieredPeriods where `is_assignable = False`
4. **`run_full_conflict_check`** — runs all three above and returns a list of `Conflict` objects

### Existing conflict model

```python
class Conflict(models.Model):
    term = models.ForeignKey(AcademicTerm, ...)
    entry_a = models.ForeignKey(TimetableEntry, ...)
    entry_b = models.ForeignKey(TimetableEntry, null=True, ...)
    conflict_type = models.CharField(...)  # 'teacher', 'year_group', 'protected_block'
    description = models.TextField()
    detected_at = models.DateTimeField(auto_now_add=True)
```

## Target Architecture

```
POST /api/timetable/validate          ─► ConflictEngine.validate_entry()
POST /api/timetable/check-bulk        ─► ConflictEngine.check_bulk()
GET  /api/timetable/conflicts/?term=  ─► ConflictEngine.run_full_check()

 ConflictEngine
 ├── check_teacher_conflicts()      # enhanced — returns typed Conflict[]
 ├── check_room_conflicts()         # NEW — overlap + capacity
 ├── check_class_conflicts()        # enhanced — rename from year_group
 ├── check_availability()           # NEW — TeacherAvailability check
 ├── check_capacity()               # NEW — room capacity vs attendance
 ├── check_protected_blocks()       # existing
 └── validate_entry()               # NEW — single-entry validation
```

## Implementation Plan

| Step | What | File(s) |
|---|---|---|
| 1 | Add `TeacherAvailability` model | `apps/lms/models/timetable.py`, migration `0018` |
| 2 | Create typed conflict dataclasses | `apps/lms/services/timetable/conflict_types.py` |
| 3 | Build room conflict + capacity validators | `apps/lms/services/timetable/validators.py` |
| 4 | Build `ConflictEngine` with `validate_entry()` | `apps/lms/services/timetable/conflict_engine.py` |
| 5 | Add `POST /validate` + `POST /check-bulk` | `apps/lms/views/timetable_v2.py`, `apps/lms/urls.py` |
| 6 | Replace Admin placeholder conflict tab | `apps/portalAdmin/.../timetable-conflict/` |
| 7 | Tests | `apps/lms/tests/test_conflict_engine.py` |

## Risk & Open Questions

- Teacher availability: needs a dedicated admin UI or CSV import flow to populate
- Room capacity: requires student enrolment data per class section to compare against `Room.capacity`
- Performance: O(n²) overlap loops are fine for a single date (<500 entries) but should be moved to DB-level queries if scale grows
- `check_availability()` depends on `TeacherAvailability` existing; needs fallback behaviour when no availability rows are defined

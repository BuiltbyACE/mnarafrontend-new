# Timetable API Contract — Unified Specification

## 1. Versioning

| Version | Status | Notes |
|---------|--------|-------|
| v1 | Current | `/lms/timetable/*` — Admin CRUD endpoints |
| v2 | Target | `/api/timetable/*` — Unified role-based view |

---

## 2. Canonical Response Models

### TimetableEntry (canonical)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | ✓ | |
| `academic_term` | `number` | ✓ | FK to AcademicTerm |
| `day_of_week` | `number` | ✓ | 0=Monday, 4=Friday |
| `day_name` | `string` | ✓ | "Monday".."Friday" |
| `tiered_period` | `number` | ✓ | FK to TieredPeriod |
| `period_name` | `string` | ✓ | e.g. "Period 1" |
| `period_sequence` | `number` | ✓ | Order within day (1-indexed) |
| `period_start` | `string` | ✓ | HH:mm format |
| `period_end` | `string` | ✓ | HH:mm format |
| `year_group` | `number` | ✓ | FK to YearGroup |
| `year_group_name` | `string` | ✓ | e.g. "Year 3" |
| `teacher` | `number` | ✓ | FK to Teacher |
| `teacher_name` | `string` | ✓ | |
| `subject` | `number` | ✓ | FK to SubjectCode |
| `subject_code` | `string` | ✓ | e.g. "MATH" |
| `subject_name` | `string` | ✓ | e.g. "Mathematics" |
| `subject_category` | `string` | ✓ | e.g. "Core" |
| `room` | `number | null` | ✓ | FK to Room |
| `room_detail` | `Room | null` | ✗ | Nested object |
| `is_practical` | `boolean` | ✓ | |
| `practical_rooms` | `string` | ✓ | Comma-separated |
| `raw_cell_code` | `string` | ✓ | Original PDF cell code |

---

## 3. Endpoint Specifications

### 3.1 GET /lms/timetable/entries/

List timetable entries with optional filters.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | `number` | ✗ | Filter by academic term |
| `day` | `number` | ✗ | Filter by day_of_week (0-4) |
| `teacher` | `number` | ✗ | Filter by teacher ID |
| `year_group` | `number` | ✗ | Filter by year group ID |

**Response:** `TimetableEntry[]`

### 3.2 GET /lms/timetable/entries/week/

Get timetable entries grouped by day.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | `number` | ✗ | Filter by academic term |
| `teacher` | `number` | ✗ | Filter by teacher ID |
| `year_group` | `number` | ✗ | Filter by year group ID |

**Response:**
```json
{
  "monday": [...],
  "tuesday": [...],
  "wednesday": [...],
  "thursday": [...],
  "friday": [...]
}
```

### 3.3 GET /lms/my-timetable/ (Student)

Get the current student's timetable.

**Authentication:** Student user required

**Response:**
```json
{
  "events": [{ "id", "title", "type", "start_date", "end_date", "color" }],
  "lessons": [{ "id", "day_of_week", "subject_name", "teacher_name", "room", "start_time", "end_time", "color" }]
}
```

**Migration Target:** Return `TimetableEntry[]` (canonical) instead of `lessons[]`.

### 3.4 GET /academics/my-timetable/ (Teacher)

Get the current teacher's timetable.

**Authentication:** Teacher user required

**Response:**
```json
{
  "Monday": { "7:30": { "subject": "...", "classroom": "..." } },
  "Tuesday": {}
}
```

**Migration Target:** Return `TimetableEntry[]` (canonical) instead of nested map.

### 3.5 GET /lms/timetable/conflicts/

Check timetable conflicts for a term.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | `number` | ✓ | Academic term ID |

**Response:**
```json
{
  "count": 0,
  "conflicts": [{
    "conflict_type": "TEACHER",
    "entry_a_id": null,
    "entry_b_id": null,
    "day_of_week": 0,
    "start_time": "08:00",
    "end_time": "08:40",
    "description": "...",
    "severity": "ERROR"
  }]
}
```

### 3.6 GET /lms/timetable/entries/{id}/

Retrieve single entry. **Response:** `TimetableEntry`

### 3.7 POST /lms/timetable/entries/

Create new entry.

**Request Body:** `TimetableEntryWrite`
```json
{
  "academic_term": 12,
  "day_of_week": 0,
  "tiered_period": 5,
  "year_group": 3,
  "teacher": 15,
  "subject": 8,
  "room": 12,
  "is_practical": false,
  "practical_rooms": "",
  "raw_cell_code": "4MATH"
}
```

**Response:** `TimetableEntry` (201 Created)

### 3.8 PATCH /lms/timetable/entries/{id}/

Partial update. **Response:** `TimetableEntry`

### 3.9 DELETE /lms/timetable/entries/{id}/

Delete entry. **Response:** 204 No Content

---

## 4. Unified API Layer (v2 Target)

Replace the three divergent endpoints with a single service-backed layer:

```
Current:                          Target:
GET /lms/my-timetable/            GET /api/v2/timetable/student/
GET /academics/my-timetable/      GET /api/v2/timetable/teacher/
GET /lms/timetable/entries/       GET /api/v2/timetable/admin/
--                                GET /api/v2/timetable/parent/
```

All v2 endpoints return canonical `TimetableEntry[]` instead of portal-specific shapes.
All v2 endpoints are backed by a single `TimetableService` in the Django backend.

### v2 Endpoint Specifications

| Endpoint | Method | Response | Auth |
|----------|--------|----------|------|
| `/api/v2/timetable/student/` | GET | `{ entries: TimetableEntry[], events: TimetableEvent[] }` | Student |
| `/api/v2/timetable/teacher/` | GET | `TimetableEntry[]` | Teacher |
| `/api/v2/timetable/admin/` | GET | `TimetableEntry[]` (filtered) | Admin |
| `/api/v2/timetable/parent/` | GET | `{ children: { [student]: TimetableEntry[] } }` | Parent |

### Backend Implementation

Create `apps/lms/services/timetable_service.py`:

```python
class TimetableService:
    def get_student_timetable(self, user) -> dict:
        # Returns canonical TimetableEntry[] + TimetableEvent[]
        ...

    def get_teacher_timetable(self, user) -> list:
        # Returns canonical TimetableEntry[]
        ...

    def get_admin_timetable(self, user, filters) -> list:
        # Returns canonical TimetableEntry[] with filters
        ...

    def get_parent_timetable(self, user) -> dict:
        # Returns per-child canonical TimetableEntry[]
        ...
```

This eliminates the three separate query implementations currently spread across
`academics/views.py`, `apps/lms/views/timetable_v2.py`, and `apps/lms/views/student_timetable.py`.

---

## 5. Current Frontend → Backend Mapping (Week 2 Status)

| Portal | Frontend Import | Backend Endpoint | Response Shape |
|--------|----------------|------------------|----------------|
| Admin | `@sms/domain/timetable` | `/lms/timetable/entries/week/` | `WeekViewResponse` → canonical `TimetableEntry[]` |
| Teacher | `@sms/domain/timetable` | `/academics/my-timetable/` | `{day: {time: entry}}` → mapped via `TeacherTimetableMapper` |
| Student | `@sms/domain/timetable` | `/lms/my-timetable/` | `{events, lessons}` → mapped via `StudentTimetableMapper` |
| Parent | `parent.models.ts` (local, deprecated) | `/academics/my-timetable/` | `TimetableEntry[]` (flat legacy format) |

---

*Generated: 2026-06-22*
*Updated: 2026-06-22 (Week 2)*

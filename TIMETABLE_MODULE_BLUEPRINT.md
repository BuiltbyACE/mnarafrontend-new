# Mnara School — Timetable Generation & Live Tracking Module
## Comprehensive Implementation Blueprint

> **Scope:** Django + Angular Nx Monorepo · Term 3 (April–July 2026)  
> **Author role:** Staff Engineer + Constraint Satisfaction Expert  
> **Status:** Pre-implementation design document

---

## Table of Contents

1. [Timetable Data Analysis — What the PDF Actually Contains](#1-timetable-data-analysis)
2. [Architectural Constraints & Pre-conditions](#2-architectural-constraints--pre-conditions)
3. [Domain Model Design](#3-domain-model-design)
4. [Backend Implementation Plan](#4-backend-implementation-plan)
5. [Constraint Satisfaction Engine](#5-constraint-satisfaction-engine)
6. [API Layer Design](#6-api-layer-design)
7. [Frontend Implementation Plan](#7-frontend-implementation-plan)
8. [Real-Time Live Tracking Architecture](#8-real-time-live-tracking-architecture)
9. [Monorepo File Structure](#9-monorepo-file-structure)
10. [Implementation Phases & Timeline](#10-implementation-phases--timeline)
11. [Risk Register](#11-risk-register)

---

## 1. Timetable Data Analysis

Before writing a single line of code, we must fully understand the source data. The Mnara School Term 3 PDF contains **10 distinct class groups** across 4 key stages, and each has structurally different scheduling behaviour. This section is the ground truth that drives every technical decision below.

### 1.1 Key Stages & Year Groups

| Key Stage | Year Groups | Daily Start | Daily End | Notes |
|-----------|-------------|-------------|-----------|-------|
| EYF | KG1, KG2, Reception | 7:30 | 15:40 | No subject-teacher codes. Activities named in full. |
| KS1 | Year 1, Year 2 | 7:15 | 3:40 | Compound codes begin (e.g. `MATH12`, `ENG12`). |
| KS2 | Year 3, 4, 5, 6 | 7:15 | 3:40 | Friday runs a completely different template. |
| KS3 | Year 7, 8, 9, 10 | 7:15 | 3:40 | 60-min academic periods. Practicals noted (e.g. `CHEM3 PRAC 3/4`). |

### 1.2 Bell Schedule Analysis — The Core Complexity

This is the most critical finding. There is **no single bell schedule** that applies across the school. We identified **four distinct bell schedule templates**:

#### Template A — EYF (KG1 / KG2)
```
7:30–7:50   (20 min)  — Morning Registration / Institutional block
7:50–8:30   (40 min)  — Period 1
8:30–9:30   (60 min)  — News Telling / Institutional block
9:30–10:10  (40 min)  — Period 2
10:10–10:40 (30 min)  — Break
10:40–11:20 (40 min)  — Period 3
11:20–12:00 (40 min)  — Period 4
12:00–12:40 (40 min)  — Period 5
12:40–13:40 (60 min)  — Lunch / Resting Time
13:40–15:30 (110 min) — Resting Time / Activities
15:30–15:40 (10 min)  — Exits
```

#### Template B — EYF Reception
```
7:30–7:50   (20 min)  — Morning block
7:50–8:30   (40 min)  — Period 1
8:30–9:30   (60 min)  — Institutional block
9:30–10:10  (40 min)  — Period 2
10:10–10:40 (30 min)  — Break
10:40–11:20 (40 min)  — Period 3
11:20–12:00 (40 min)  — Period 4
12:00–12:40 (40 min)  — Period 5
12:40–13:40 (60 min)  — Lunch
13:40–14:20 (40 min)  — Period 6
14:20–15:00 (40 min)  — Period 7
15:00–15:30 (30 min)  — Circle Time / Institutional
15:30–15:40 (10 min)  — Exits
```

#### Template C — KS1 / KS2 (Mon–Thu)
```
7:15–7:30   (15 min)  — Adhkaar
7:30–8:30   (60 min)  — Quran
8:30–8:40/8:50 (10-20 min) — Circle Time / Home Room
8:40/8:50–9:20/9:30 (40 min) — Period 1
9:20/9:30–10:00 (40 min)    — Period 2
10:00–10:30 (30 min)  — Snack/Play Break
10:30–11:20 (50 min)  — Period 3
11:20–12:10 (50 min)  — Period 4
12:10–13:00 (50 min)  — Period 5
13:00–13:50 (50 min)  — Lunch
13:50–14:40 (50 min)  — Period 6
14:40–15:30 (50 min)  — Period 7
15:30–15:40 (10 min)  — Exits
```

#### Template D — KS3 (Mon–Thu)
```
7:15–7:30   (15 min)  — Adhkaar
7:30–7:45   (15 min)  — Home Room
7:45–8:45   (60 min)  — Period 1
8:45–9:45   (60 min)  — Period 2
9:45–10:45  (60 min)  — Quran (institutional block)
10:45–11:15 (30 min)  — Snack/Play Break
11:15–11:55 (40 min)  — Period 3
11:55–12:40 (45 min)  — Period 4
12:40–13:20 (40 min)  — Period 5
13:20–14:00 (40 min)  — Lunch
14:00–14:45 (45 min)  — Period 6
14:45–15:30 (45 min)  — Period 7
15:30–15:40 (10 min)  — Exits
```

#### Template E — Friday (KS2 + KS3 universal)
```
7:15–7:30   (15 min)  — Adhkar
7:30–8:00   (30 min)  — Assembly
8:00–9:00   (60 min)  — Academic Period 1
9:00–10:00  (60 min)  — Quran
10:00–10:45 (45 min)  — Academic Period 2
10:45–11:10 (25 min)  — Break
11:10–11:55 (45 min)  — Academic Period 3
11:55–12:40 (45 min)  — Academic Period 4
12:40–14:00 (80 min)  — PRAYER / LUNCH (fixed institutional block)
14:00–15:30 (90 min)  — ACTIVITIES (fixed institutional block)
```

> **Key engineering implication:** A `ClassPeriod` model with a single global `start_time` and `end_time` **cannot represent this school**. We need tiered bell schedules as a first-class domain concept.

### 1.3 Compound Code Analysis

For KS1 and above, every cell encodes `[SUBJECT_CODE][TEACHER_ID]`. The full teacher-to-subject map extracted from the PDF:

| Teacher ID | Appears with subjects | Likely Role |
|------------|----------------------|-------------|
| 1 | MATH, MAT | Maths teacher (Senior, used across KS3) |
| 2 | HIST, HIS, PE, GEO | Multi-subject / PE teacher |
| 3 | SCIE, CHEM, BIO | Science teacher |
| 4 | MATH, CHEM, PHY | Secondary maths/science |
| 5 | ENG | English teacher (KS2/KS3) |
| 6 | ENG, MAT | English teacher (another cohort) |
| 7 | MATH, ENG, SCIE | KS1 Year 2 class teacher |
| 8 | ART | Art specialist |
| 9 | ICT | ICT specialist |
| 10 | MATH, ENG, PHY | KS2/KS3 maths |
| 11 | ENG, READ, HIST | KS2 English |
| 12 | MATH, ENG, SCIE, HMNTY, SPELLING | KS1 Year 1 class teacher |
| 13 | ARA, ARAB | Arabic teacher |
| 14 | TARBIYA, TAR, TAWH, TAW, SEER | Islamic Studies (Tarbiya/Tawhed) |
| 15 | TARB, TAR, ISLA, HAD | Islamic Studies (separate teacher) |
| 16 | ARABIC, ARAB | Arabic (EYF/KS1) |
| 17 | ARA | Arabic (KS2) |
| 19 | TAR, TAW, HAD, FIQH, SEER | Islamic Studies (KS2/KS3) |
| 20 | GEO, ECON | Geography/Economics |
| 21 | ART | Art (Friday specialist) |

**Special compound cases to parse:**
- `CHEM3 PRAC 3/4` → Chemistry teacher 3, practical session, rooms 3 and 4 (split room)
- `SWA8/2` → Swahili, teacher 8 or 2 alternating (or co-teaching)
- `ARA13 / SWA8/2` → Cell contains two simultaneous options (differentiated groups)

### 1.4 Institutional Blocks (Global Locks)

These entries must be registered as **non-assignable institutional blocks** that cannot be overwritten by lesson scheduling:

| Block Name | Applies to | Days |
|------------|------------|------|
| ADHKAAR / ADHKAR | KS1, KS2, KS3 | Mon–Fri |
| QURAN | KS1, KS2, KS3 | Mon–Fri |
| ASSEMBLY | All stages | Mon (KS1/KS2), Fri (KS3) |
| SNACK/PLAY BREAK | KS1, KS2, KS3 | Mon–Thu |
| BREAK | KS1, KS2, KS3 | Friday |
| LUNCH | All stages | Mon–Thu |
| PRAYER/LUNCH | KS2, KS3 | Friday |
| ACTIVITIES | KS2, KS3 | Friday |
| RESTING TIME | EYF | Mon–Thu |
| HOME ROOM / CIRCLE TIME | KS1, KS2, KS3 | Mon–Thu |
| NEWS TELLING | EYF | Daily (rotational) |

---

## 2. Architectural Constraints & Pre-Conditions

Before the timetable engine can be integrated, the existing system has critical gaps that **must be resolved first**. Building on the current foundation without these fixes will cause data corruption.

### 2.1 Non-Negotiable Pre-conditions (Phase 0)

These are not optional. They are the load-bearing walls of the entire module.

#### Fix 1 — Multi-Tenancy Partition Key

The current system has **zero tenant isolation**. Every scheduling query runs across all rows of all schools.

```python
# Every scheduling model needs this field added:
school = models.ForeignKey(
    'accounts.School',
    on_delete=models.CASCADE,
    db_index=True
)
```

A `School` model (distinct from the singleton `SchoolInfo`) must be created and a `school_id` claim added to the JWT. A DRF `BaseFilterBackend` must auto-filter all querysets by `request.user.school` so queries are physically scoped to one tenant.

#### Fix 2 — Temporal Field Migration

`ClassPeriod.start_time` and `ClassPeriod.end_time` are plain `TimeField` columns. Overlap detection using two separate equality ORM queries is logically broken — it misses partial overlaps entirely.

Migration path:
```sql
-- Add tstzrange columns for proper overlap detection
ALTER TABLE lms_classperiod 
ADD COLUMN effective_range tstzrange 
GENERATED ALWAYS AS (tstzrange(start_time::timestamptz, end_time::timestamptz)) STORED;

-- Add GiST index for overlap operator &&
CREATE INDEX CONCURRENTLY idx_period_range_gist
ON lms_classperiod USING GiST (effective_range);
```

#### Fix 3 — Transaction Isolation on Writes

The current `TimetableSlot.clean()` runs outside `transaction.atomic()`. Under concurrent admin writes, two threads will both pass the conflict check before either INSERT commits — classic TOCTOU race condition.

```python
# Required pattern on every scheduling write:
with transaction.atomic():
    TimetableSlot.objects.select_for_update().filter(
        school=self.school,
        teacher=self.teacher,
        day_of_week=self.day_of_week,
        period=self.period
    )
    # ... validate, then save
```

#### Fix 4 — Remove the pk=None Bug

```python
# Current broken code:
.exclude(pk=self.pk)  # When pk is None (new object), this excludes nothing

# Fix:
if self.pk:
    qs = qs.exclude(pk=self.pk)
```

### 2.2 System Capabilities Required

| Capability | Current State | Required State |
|------------|--------------|----------------|
| Multi-tenancy | ❌ None | ✅ school_id on every scheduling model |
| Temporal overlap detection | ❌ Equality only | ✅ Range overlap with GiST index |
| Concurrent write safety | ❌ Race condition | ✅ select_for_update + atomic |
| Tiered bell schedules | ❌ Single global ClassPeriod | ✅ BellSchedule per tier |
| Friday schedule variation | ❌ Not modelled | ✅ Day-specific schedule template |
| Compound code parsing | ❌ Not modelled | ✅ Subject + Teacher FK linkage |
| Institutional block locking | ❌ Not enforced | ✅ is_institutional_block flag |
| Real-time location | ❌ Not built | ✅ WebSocket + Redis channel layer |
| Angular dynamic grid | ❌ Hardcoded 10-slot | ✅ Virtual-scrolled dynamic slots |

---

## 3. Domain Model Design

### 3.1 Entity Relationship Overview

```
School
  └─── BellSchedule (EYF_MON_THU, KS3_MON_THU, KS3_FRI, ...)
         └─── TieredPeriod (Period 1, Snack Break, Lunch, ...)
                └─── TimetableEntry
                       ├─── Teacher (FK)
                       ├─── Subject (FK)
                       ├─── YearGroup (FK)
                       └─── Room (FK)

InstitutionalBlock
  ├─── applies_to_stages (M2M → AcademicTier)
  └─── applies_on_days (ArrayField)

TeacherTrackingPreference (1:1 → Teacher)
TeacherLocationAudit (log of every live lookup)
```

### 3.2 Core Model Specifications

#### `BellSchedule`
Represents one complete daily structure. A school will have multiple: one per key stage, plus one Friday variant per key stage.

| Field | Type | Notes |
|-------|------|-------|
| `school` | FK → School | Tenant discriminator |
| `name` | CharField | e.g. "KS3 Monday–Thursday" |
| `tier` | CharField (choices) | EYF / KS1 / KS2 / KS3 |
| `applies_on_days` | ArrayField(IntegerField) | [0,1,2,3] = Mon–Thu |
| `year_levels` | M2M → YearLevel | Which year groups use this schedule |

#### `TieredPeriod`
A single slot within a `BellSchedule`. One-to-many under its schedule.

| Field | Type | Notes |
|-------|------|-------|
| `schedule` | FK → BellSchedule | Parent schedule |
| `name` | CharField | "Period 1", "Quran Block", "Lunch" |
| `sequence` | IntegerField | Ordering within the day |
| `start_time` | TimeField | Exact start |
| `end_time` | TimeField | Exact end |
| `duration_minutes` | computed property | `(end - start).seconds // 60` |
| `period_type` | CharField (choices) | ACADEMIC / BREAK / INSTITUTIONAL / TRANSITION |
| `is_assignable` | BooleanField | False for breaks, lunch, adhkaar etc. |

#### `InstitutionalBlock`
Global recurring blocks that lock out scheduling across entire stages.

| Field | Type | Notes |
|-------|------|-------|
| `school` | FK → School | Tenant |
| `name` | CharField | "ADHKAAR", "PRAYER/LUNCH" |
| `applies_to_tiers` | M2M → AcademicTier | Which key stages |
| `applies_on_days` | ArrayField | Day integers |
| `start_time` | TimeField | |
| `end_time` | TimeField | |

#### `TimetableEntry`
The atomic assignment record: one teacher, one subject, one class, one room, in one period, on one day.

| Field | Type | Notes |
|-------|------|-------|
| `school` | FK → School | Tenant |
| `tiered_period` | FK → TieredPeriod | Which bell slot |
| `day_of_week` | IntegerField | 0=Mon … 4=Fri |
| `year_group` | FK → YearGroup | Which class |
| `teacher` | FK → TeacherExtension | Parsed from subject code suffix |
| `subject` | FK → Subject | Parsed from subject code prefix |
| `room` | FK → Room | Physical location |
| `is_practical` | BooleanField | True for CHEM3 PRAC |
| `practical_rooms` | M2M → Room | For split-room practicals |
| `raw_cell_code` | CharField | Original value e.g. "CHEM3 PRAC 3/4" for audit |
| `academic_term` | FK → AcademicTerm | Term scoping |

#### `SubjectCode` (lookup table)
Pre-populated mapping of abbreviations to full subject names.

| Code | Subject Name | Category |
|------|-------------|----------|
| ENG | English | Core |
| MATH / MAT | Mathematics | Core |
| SCIE / SCIE | Science | Core |
| ARA / ARAB | Arabic | Islamic |
| TARB / TAR | Tarbiya | Islamic |
| TAWH / TAW | Tawheed | Islamic |
| FIQH | Fiqh | Islamic |
| ISLA | Islamic Studies | Islamic |
| HAD | Hadith | Islamic |
| SEER | Seerah | Islamic |
| GEO | Geography | Humanities |
| HIST / HIS | History | Humanities |
| ECON / ECO | Economics | Humanities |
| ICT | ICT | Technical |
| ART | Art & Design | Creative |
| PE / P.E | Physical Education | Sport |
| SWA | Swahili | Language |
| HMNTY / HMN | Humanities | Humanities |
| BIO | Biology | Science |
| CHEM | Chemistry | Science |
| PHY | Physics | Science |
| READ | Reading | Literacy |
| SPELLING | Spelling | Literacy |

---

## 4. Backend Implementation Plan

### 4.1 File Structure within the Monorepo

```
libs/backend/timetable/
├── __init__.py
├── models.py                  # All domain models (BellSchedule, TieredPeriod, TimetableEntry, etc.)
├── admin.py                   # Django admin registrations with inline support
├── serializers.py             # DRF serializers for API layer
├── views.py                   # ViewSets + live-tracker endpoint
├── urls.py                    # URL routing
├── filters.py                 # DRF filter backends (tenant scoping, day/period filters)
├── permissions.py             # RBAC: admin vs teacher vs student access
│
├── engine/
│   ├── __init__.py
│   ├── parser.py              # Compound code parser (e.g. "CHEM3 PRAC 3/4" → structured dict)
│   ├── solver.py              # CSP backtracking / conflict resolution
│   ├── validators.py          # Hard constraint rules (teacher clash, room clash, tier rules)
│   └── scheduler.py           # Auto-generation orchestrator
│
├── migrations/
│   └── (auto-generated)
│
└── management/
    └── commands/
        ├── import_timetable.py    # One-time import of PDF data via CLI
        └── seed_bell_schedules.py # Seed Mnara's bell schedule templates
```

### 4.2 Model Implementation — `models.py`

```python
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.indexes import GistIndex
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q


class AcademicTier(models.TextChoices):
    EYF = 'EYF', 'Early Years Foundation'
    KS1 = 'KS1', 'Key Stage 1'
    KS2 = 'KS2', 'Key Stage 2'
    KS3 = 'KS3', 'Key Stage 3'


class PeriodType(models.TextChoices):
    ACADEMIC     = 'ACADEMIC',     'Academic Period'
    INSTITUTIONAL= 'INSTITUTIONAL','Institutional Block'
    BREAK        = 'BREAK',        'Break / Snack'
    TRANSITION   = 'TRANSITION',   'Transition / Registration'


class DayOfWeek(models.IntegerChoices):
    MONDAY    = 0, 'Monday'
    TUESDAY   = 1, 'Tuesday'
    WEDNESDAY = 2, 'Wednesday'
    THURSDAY  = 3, 'Thursday'
    FRIDAY    = 4, 'Friday'


# ─── Bell Schedule ──────────────────────────────────────────────────────────

class BellSchedule(models.Model):
    """
    One complete daily time structure for a specific key stage and day pattern.
    Mnara School requires at least 5 schedules:
      - EYF_KG1_KG2, EYF_RECEPTION (Mon-Thu)
      - KS1_KS2 (Mon-Thu)
      - KS3 (Mon-Thu)
      - KS2_KS3_FRIDAY (universal)
    """
    school       = models.ForeignKey('accounts.School', on_delete=models.CASCADE)
    name         = models.CharField(max_length=100)
    tier         = models.CharField(max_length=10, choices=AcademicTier.choices)
    applies_on_days = ArrayField(
        models.IntegerField(choices=DayOfWeek.choices),
        help_text="List of day integers this schedule applies to [0,1,2,3,4]"
    )

    class Meta:
        unique_together = ('school', 'name')

    def __str__(self):
        return f"[{self.tier}] {self.name}"


class TieredPeriod(models.Model):
    """
    A single time slot within a BellSchedule.
    Captures the variable-duration reality of the school's grid.
    """
    schedule        = models.ForeignKey(BellSchedule, on_delete=models.CASCADE, related_name='periods')
    name            = models.CharField(max_length=100)   # "Period 1", "Quran Block", "Lunch"
    sequence        = models.PositiveSmallIntegerField()  # Ordering within the day
    start_time      = models.TimeField()
    end_time        = models.TimeField()
    period_type     = models.CharField(max_length=20, choices=PeriodType.choices, default=PeriodType.ACADEMIC)
    is_assignable   = models.BooleanField(
        default=True,
        help_text="False for breaks, institutional blocks, transitions"
    )

    class Meta:
        ordering = ['sequence']
        unique_together = ('schedule', 'sequence')

    @property
    def duration_minutes(self):
        from datetime import datetime, date
        start = datetime.combine(date.today(), self.start_time)
        end   = datetime.combine(date.today(), self.end_time)
        return int((end - start).seconds / 60)

    def __str__(self):
        return f"{self.schedule.name} | {self.name} ({self.start_time}–{self.end_time})"


# ─── Subjects & Rooms ────────────────────────────────────────────────────────

class SubjectCode(models.Model):
    """Lookup table: 'ENG' → 'English'. Pre-seeded from analysis above."""
    school       = models.ForeignKey('accounts.School', on_delete=models.CASCADE)
    code         = models.CharField(max_length=20)    # 'ENG', 'MATH', 'CHEM'
    full_name    = models.CharField(max_length=100)   # 'English', 'Mathematics'
    category     = models.CharField(max_length=50)    # 'Core', 'Islamic', 'Science'

    class Meta:
        unique_together = ('school', 'code')


class Room(models.Model):
    school      = models.ForeignKey('accounts.School', on_delete=models.CASCADE)
    name        = models.CharField(max_length=100)    # "Lab 1", "Main Hall", "Room 3"
    capacity    = models.PositiveSmallIntegerField(null=True, blank=True)
    is_lab      = models.BooleanField(default=False)
    is_shared   = models.BooleanField(default=False)  # For shared resources like the hall

    class Meta:
        unique_together = ('school', 'name')


# ─── Core Timetable Entry ────────────────────────────────────────────────────

class TimetableEntry(models.Model):
    """
    The atomic assignment: one teacher → one subject → one year group
    in one physical room, during one tiered period, on one day of the week.
    """
    school          = models.ForeignKey('accounts.School', on_delete=models.CASCADE)
    academic_term   = models.ForeignKey('academics.AcademicTerm', on_delete=models.CASCADE)
    tiered_period   = models.ForeignKey(TieredPeriod, on_delete=models.PROTECT)
    day_of_week     = models.IntegerField(choices=DayOfWeek.choices)

    year_group      = models.ForeignKey('academics.YearGroup', on_delete=models.CASCADE)
    teacher         = models.ForeignKey('staff.TeacherExtension', on_delete=models.PROTECT)
    subject         = models.ForeignKey(SubjectCode, on_delete=models.PROTECT)
    room            = models.ForeignKey(Room, on_delete=models.PROTECT)

    # Practical flags
    is_practical        = models.BooleanField(default=False)
    practical_rooms     = models.ManyToManyField(Room, blank=True, related_name='practical_entries')

    # Audit trail
    raw_cell_code       = models.CharField(max_length=50, blank=True, help_text="Original compound code, e.g. CHEM3 PRAC 3/4")
    created_by          = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='+')
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Timetable Entries"
        indexes = [
            models.Index(fields=['school', 'academic_term', 'day_of_week']),
            models.Index(fields=['teacher', 'day_of_week']),
            models.Index(fields=['room', 'day_of_week']),
            models.Index(fields=['year_group', 'day_of_week']),
        ]

    def _get_overlapping_base_query(self):
        """
        Returns a queryset of TimetableEntry rows whose tiered_period
        overlaps with self's tiered_period on the same day (within the same school/term).
        Overlap condition: start_A < end_B AND end_A > start_B
        """
        my_start = self.tiered_period.start_time
        my_end   = self.tiered_period.end_time
        return TimetableEntry.objects.filter(
            school=self.school,
            academic_term=self.academic_term,
            day_of_week=self.day_of_week,
            tiered_period__start_time__lt=my_end,
            tiered_period__end_time__gt=my_start,
        )

    def clean(self):
        base_qs = self._get_overlapping_base_query()
        if self.pk:
            base_qs = base_qs.exclude(pk=self.pk)

        # Hard Constraint 1: Teacher double-booking
        if base_qs.filter(teacher=self.teacher).exists():
            clash = base_qs.filter(teacher=self.teacher).select_related('year_group', 'subject').first()
            raise ValidationError(
                f"Teacher conflict: {self.teacher} is already assigned to "
                f"{clash.subject.code} for {clash.year_group} during this slot."
            )

        # Hard Constraint 2: Room double-booking
        if base_qs.filter(room=self.room).exists():
            clash = base_qs.filter(room=self.room).select_related('year_group').first()
            raise ValidationError(
                f"Room conflict: {self.room} is occupied by {clash.year_group} during this slot."
            )

        # Hard Constraint 3: Year group double-booking (same class, two subjects simultaneously)
        if base_qs.filter(year_group=self.year_group).exists():
            raise ValidationError(
                f"Schedule conflict: {self.year_group} already has a lesson during this slot."
            )

        # Hard Constraint 4: Institutional block protection
        if not self.tiered_period.is_assignable:
            raise ValidationError(
                f"Cannot assign lesson to '{self.tiered_period.name}' — "
                f"this is a protected institutional block."
            )

    @transaction.atomic
    def save(self, *args, **kwargs):
        # Pessimistic lock: grab existing rows for this teacher + room on this day
        TimetableEntry.objects.select_for_update().filter(
            school=self.school,
            teacher=self.teacher,
            day_of_week=self.day_of_week,
        )
        self.full_clean()
        super().save(*args, **kwargs)


# ─── Live Tracking ────────────────────────────────────────────────────────────

class TeacherTrackingPreference(models.Model):
    teacher                 = models.OneToOneField('staff.TeacherExtension', on_delete=models.CASCADE)
    is_visible_to_students  = models.BooleanField(default=True)
    is_visible_to_admin     = models.BooleanField(default=True)
    tracking_window_start   = models.TimeField(default='07:00')
    tracking_window_end     = models.TimeField(default='17:00')


class TeacherLocationAudit(models.Model):
    viewer      = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='location_lookups')
    teacher     = models.ForeignKey('staff.TeacherExtension', on_delete=models.CASCADE)
    viewed_at   = models.DateTimeField(auto_now_add=True)
    ip_address  = models.GenericIPAddressField(null=True)
    user_agent  = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=['teacher', 'viewed_at'])]
```

### 4.3 Compound Code Parser — `engine/parser.py`

The parser is the bridge between the raw PDF cell values and structured domain objects. It must handle every variant found in the timetable.

```python
import re
from dataclasses import dataclass
from typing import Optional

# Regex: captures subject code, teacher ID, optional PRAC flag, optional room suffixes
CELL_PATTERN = re.compile(
    r'^(?P<subject>[A-Z]+)\s*(?P<teacher_id>\d+)'
    r'(?:\s+PRAC\s*(?P<prac_rooms>[\d/]+))?$',
    re.IGNORECASE
)

# Handles multi-subject cells like "ARA13\nSWA8/2"
# and shared-teacher cells like "SWA8/2" (teacher 8 or 2)
SHARED_TEACHER_PATTERN = re.compile(r'(?P<subject>[A-Z]+)(?P<t1>\d+)/(?P<t2>\d+)')


@dataclass
class ParsedCell:
    subject_code: str
    teacher_id: int
    is_practical: bool = False
    practical_room_ids: list[str] = None
    secondary_teacher_id: Optional[int] = None  # For SWA8/2 type entries
    raw: str = ''


def parse_cell(raw_value: str) -> Optional[ParsedCell]:
    """
    Parse a timetable cell value into a structured ParsedCell.
    
    Examples:
      "ENG5"            → ParsedCell(subject='ENG', teacher_id=5)
      "CHEM3 PRAC 3/4"  → ParsedCell(subject='CHEM', teacher_id=3, is_practical=True, practical_room_ids=['3','4'])
      "SWA8/2"          → ParsedCell(subject='SWA', teacher_id=8, secondary_teacher_id=2)
      "ARA13"           → ParsedCell(subject='ARA', teacher_id=13)
    """
    raw_value = raw_value.strip()
    if not raw_value or raw_value.upper() in INSTITUTIONAL_KEYWORDS:
        return None  # Handled as institutional block, not a lesson
    
    # Check for shared teacher pattern first
    shared_match = SHARED_TEACHER_PATTERN.match(raw_value)
    if shared_match:
        return ParsedCell(
            subject_code=shared_match.group('subject').upper(),
            teacher_id=int(shared_match.group('t1')),
            secondary_teacher_id=int(shared_match.group('t2')),
            raw=raw_value
        )
    
    match = CELL_PATTERN.match(raw_value)
    if not match:
        return None
    
    practical_rooms = None
    if match.group('prac_rooms'):
        practical_rooms = match.group('prac_rooms').split('/')
    
    return ParsedCell(
        subject_code=match.group('subject').upper(),
        teacher_id=int(match.group('teacher_id')),
        is_practical=bool(practical_rooms),
        practical_room_ids=practical_rooms,
        raw=raw_value
    )


INSTITUTIONAL_KEYWORDS = {
    'ADHKAAR', 'ADHKAR', 'QURAN', 'ASSEMBLY', 'LUNCH', 'BREAK',
    'SNACK', 'PRAYER', 'ACTIVITIES', 'RESTING', 'HOMEROOM', 
    'HOME', 'ROOM', 'CIRCLE', 'TIME', 'NEWS', 'TELLING', 'EXITS'
}
```

### 4.4 Constraint Validators — `engine/validators.py`

Validators are separated from the model's `clean()` so they can be reused by the CSP solver without triggering database saves.

```python
from dataclasses import dataclass
from typing import List

@dataclass
class Conflict:
    constraint_type: str   # 'TEACHER_CLASH' | 'ROOM_CLASH' | 'YEAR_GROUP_CLASH' | 'INSTITUTIONAL_BLOCK'
    message: str
    conflicting_entry_id: int | None = None


def check_teacher_availability(teacher_id, day, period, school_id, term_id, exclude_entry_id=None) -> List[Conflict]:
    from .models import TimetableEntry
    qs = TimetableEntry.objects.filter(
        school_id=school_id, academic_term_id=term_id,
        teacher_id=teacher_id, day_of_week=day,
        tiered_period__start_time__lt=period.end_time,
        tiered_period__end_time__gt=period.start_time,
    )
    if exclude_entry_id:
        qs = qs.exclude(pk=exclude_entry_id)
    conflicts = []
    for entry in qs.select_related('subject', 'year_group'):
        conflicts.append(Conflict(
            constraint_type='TEACHER_CLASH',
            message=f"Teacher already assigned to {entry.subject.code} / {entry.year_group}",
            conflicting_entry_id=entry.pk
        ))
    return conflicts


def check_room_availability(room_id, day, period, school_id, term_id, exclude_entry_id=None) -> List[Conflict]:
    from .models import TimetableEntry
    qs = TimetableEntry.objects.filter(
        school_id=school_id, academic_term_id=term_id,
        room_id=room_id, day_of_week=day,
        tiered_period__start_time__lt=period.end_time,
        tiered_period__end_time__gt=period.start_time,
    )
    if exclude_entry_id:
        qs = qs.exclude(pk=exclude_entry_id)
    return [
        Conflict('ROOM_CLASH', f"Room occupied by {e.year_group}", e.pk)
        for e in qs.select_related('year_group')
    ]


def check_year_group_availability(year_group_id, day, period, school_id, term_id, exclude_entry_id=None) -> List[Conflict]:
    from .models import TimetableEntry
    qs = TimetableEntry.objects.filter(
        school_id=school_id, academic_term_id=term_id,
        year_group_id=year_group_id, day_of_week=day,
        tiered_period__start_time__lt=period.end_time,
        tiered_period__end_time__gt=period.start_time,
    )
    if exclude_entry_id:
        qs = qs.exclude(pk=exclude_entry_id)
    return [
        Conflict('YEAR_GROUP_CLASH', f"{e.year_group} already has {e.subject.code}", e.pk)
        for e in qs.select_related('subject')
    ]
```

---

## 5. Constraint Satisfaction Engine

### 5.1 Problem Definition

The timetable generation problem is a **Constraint Satisfaction Problem (CSP)**:

- **Variables:** Each `(year_group, subject, weekly_sessions_required)` tuple is a variable.
- **Domain:** All valid `(teacher, room, day, tiered_period)` combinations where the period `is_assignable=True`.
- **Constraints:**
  - **Hard (never violated):** No teacher double-booking, no room double-booking, no year group double-booking, no assignment to institutional blocks.
  - **Soft (minimise violations):** Teacher workload balance, subject distribution across the week, practical sessions in labs only, PE not last period on Fridays.

### 5.2 Solver Architecture — `engine/solver.py`

We implement **AC-3 Arc Consistency** for domain pruning followed by **backtracking search with forward-checking**.

```python
from collections import deque
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field


@dataclass
class Variable:
    """One lesson that needs to be scheduled."""
    id: str                          # e.g. "Year9_MATH_slot_1"
    year_group_id: int
    subject_id: int
    required_teacher_id: int | None  # None = system can assign any qualified teacher
    required_room_type: str | None   # 'LAB', 'HALL', None
    sessions_remaining: int = 1


@dataclass
class Assignment:
    variable_id: str
    teacher_id: int
    room_id: int
    day_of_week: int
    period_id: int


class TimetableCSPSolver:
    """
    AC-3 + Backtracking solver for the Mnara School timetable.
    
    Workflow:
      1. Build all Variable objects from curriculum requirements
      2. Build initial domains (all valid slots per variable)
      3. Run AC-3 to prune domains before search
      4. Run backtracking with MRV (Minimum Remaining Values) heuristic
      5. Return completed assignment or report irresolvable conflicts
    """

    def __init__(self, school_id, term_id):
        self.school_id = school_id
        self.term_id   = term_id
        self.assignment: Dict[str, Assignment] = {}

    def solve(self, variables: List[Variable]) -> Dict[str, Assignment]:
        domains = self._build_domains(variables)
        domains = self._ac3(variables, domains)
        result  = self._backtrack(variables, domains, {})
        if result is None:
            raise ValueError("No valid timetable solution found. Check constraints for conflicts.")
        return result

    def _build_domains(self, variables):
        """
        For each variable, compute every valid (teacher, room, day, period) combo.
        Initial domain = all assignable periods × available teachers × compatible rooms.
        """
        domains = {}
        for var in variables:
            slots = []
            for period in self._get_assignable_periods(var.year_group_id):
                for day in range(5):
                    for teacher_id in self._get_qualified_teachers(var.subject_id, var.required_teacher_id):
                        for room_id in self._get_compatible_rooms(var.required_room_type):
                            slots.append((teacher_id, room_id, day, period.id))
            domains[var.id] = slots
        return domains

    def _ac3(self, variables, domains):
        """Arc Consistency 3 — prune domains before search begins."""
        queue = deque()
        for v in variables:
            for other in variables:
                if v.id != other.id:
                    queue.append((v.id, other.id))
        
        while queue:
            xi_id, xj_id = queue.popleft()
            if self._revise(xi_id, xj_id, domains):
                if not domains[xi_id]:
                    return None  # Domain wiped out — unsolvable
                for xk in variables:
                    if xk.id != xj_id:
                        queue.append((xk.id, xi_id))
        return domains

    def _revise(self, xi_id, xj_id, domains):
        """Remove values from xi's domain that have no consistent value in xj's domain."""
        revised = False
        to_remove = []
        for value_i in domains[xi_id]:
            teacher_i, room_i, day_i, period_i = value_i
            satisfiable = any(
                not (teacher_i == teacher_j and day_i == day_j and period_i == period_j) and
                not (room_i == room_j and day_i == day_j and period_i == period_j)
                for teacher_j, room_j, day_j, period_j in domains[xj_id]
            )
            if not satisfiable:
                to_remove.append(value_i)
                revised = True
        for v in to_remove:
            domains[xi_id].remove(v)
        return revised

    def _backtrack(self, variables, domains, assignment):
        if len(assignment) == len(variables):
            return assignment
        
        # MRV: pick the variable with the smallest domain (most constrained first)
        unassigned = [v for v in variables if v.id not in assignment]
        var = min(unassigned, key=lambda v: len(domains[v.id]))
        
        for value in domains[var.id]:
            teacher_id, room_id, day, period_id = value
            if self._is_consistent(var, teacher_id, room_id, day, period_id, assignment):
                assignment[var.id] = Assignment(var.id, teacher_id, room_id, day, period_id)
                result = self._backtrack(variables, domains, assignment)
                if result is not None:
                    return result
                del assignment[var.id]
        
        return None  # Backtrack

    def _is_consistent(self, var, teacher_id, room_id, day, period_id, assignment):
        """Check that assigning this value doesn't violate any constraint against current assignments."""
        for other_id, other_assignment in assignment.items():
            if (other_assignment.teacher_id == teacher_id and
                other_assignment.day_of_week == day and
                other_assignment.period_id == period_id):
                return False  # Teacher clash
            if (other_assignment.room_id == room_id and
                other_assignment.day_of_week == day and
                other_assignment.period_id == period_id):
                return False  # Room clash
        return True

    # ── Helper methods (DB queries) ──────────────────────────────────────────
    def _get_assignable_periods(self, year_group_id):
        from .models import TieredPeriod
        return TieredPeriod.objects.filter(
            schedule__school_id=self.school_id,
            is_assignable=True
        ).select_related('schedule')

    def _get_qualified_teachers(self, subject_id, required_teacher_id=None):
        from staff.models import TeacherExtension
        if required_teacher_id:
            return [required_teacher_id]
        return list(TeacherExtension.objects.filter(
            school_id=self.school_id,
            subjects=subject_id
        ).values_list('id', flat=True))

    def _get_compatible_rooms(self, required_room_type=None):
        from .models import Room
        qs = Room.objects.filter(school_id=self.school_id)
        if required_room_type == 'LAB':
            qs = qs.filter(is_lab=True)
        return list(qs.values_list('id', flat=True))
```

### 5.3 Live Teacher Locator — `engine/locator.py`

```python
from django.utils import timezone
from django.db.models import Q


def locate_teacher_now(teacher_id: int, school_id: int, requesting_user) -> dict:
    """
    Returns the current physical location of a teacher based on the live clock.
    Enforces privacy preferences and logs every access.
    """
    from .models import TimetableEntry, TeacherTrackingPreference, TeacherLocationAudit

    # Privacy check
    prefs = TeacherTrackingPreference.objects.filter(teacher_id=teacher_id).first()
    if prefs and not _user_can_view(requesting_user, prefs):
        return {"status": "RESTRICTED", "message": "Teacher has restricted location visibility."}

    now         = timezone.localtime()
    current_day = now.weekday()
    current_t   = now.time()

    # Log the access
    TeacherLocationAudit.objects.create(
        viewer=requesting_user,
        teacher_id=teacher_id,
        ip_address=getattr(requesting_user, '_request_ip', None),
        user_agent=getattr(requesting_user, '_request_ua', ''),
    )

    entry = TimetableEntry.objects.filter(
        school_id=school_id,
        teacher_id=teacher_id,
        day_of_week=current_day,
        tiered_period__start_time__lte=current_t,
        tiered_period__end_time__gte=current_t,
    ).select_related('tiered_period', 'room', 'subject', 'year_group').first()

    if not entry:
        return {"status": "AVAILABLE", "location": "Staff Room / Off-duty", "context": None}

    if not entry.tiered_period.is_assignable:
        return {
            "status": "INSTITUTIONAL_BLOCK",
            "location": "Assembly / Prayer Area",
            "context": entry.tiered_period.name
        }

    return {
        "status": "IN_CLASS",
        "location": entry.room.name,
        "context": {
            "subject": entry.subject.full_name,
            "year_group": str(entry.year_group),
            "period": entry.tiered_period.name,
            "ends_at": entry.tiered_period.end_time.strftime('%H:%M'),
        }
    }


def _user_can_view(user, prefs: 'TeacherTrackingPreference') -> bool:
    if hasattr(user, 'is_admin') and user.is_admin:
        return prefs.is_visible_to_admin
    return prefs.is_visible_to_students
```

---

## 6. API Layer Design

### 6.1 Endpoints

| Method | URL | Description | Permission |
|--------|-----|-------------|------------|
| `GET` | `/api/timetable/bell-schedules/` | List all bell schedules for the school | Admin |
| `GET` | `/api/timetable/bell-schedules/{id}/periods/` | List periods in a schedule | Admin, Teacher |
| `GET` | `/api/timetable/entries/` | Full timetable (filterable by year_group, teacher, day) | Admin |
| `GET` | `/api/timetable/entries/my/` | Authenticated teacher's own timetable | Teacher |
| `GET` | `/api/timetable/entries/class/{year_group_id}/` | A class's full week | Teacher, Student (own class) |
| `POST` | `/api/timetable/entries/` | Create single entry (validates constraints) | Admin |
| `PUT` | `/api/timetable/entries/{id}/` | Update entry (re-validates) | Admin |
| `DELETE` | `/api/timetable/entries/{id}/` | Remove entry | Admin |
| `POST` | `/api/timetable/generate/` | Trigger CSP solver for a term | Admin |
| `GET` | `/api/timetable/conflicts/` | List all constraint violations in current timetable | Admin |
| `GET` | `/api/timetable/locate/{teacher_id}/` | Live location lookup | Admin, Teacher (self) |
| `GET` | `/api/timetable/locate/all/` | All staff locations (for admin dashboard) | Admin |

### 6.2 Key Serializer Shapes

#### `TimetableEntrySerializer` response:
```json
{
  "id": 1042,
  "day_of_week": 0,
  "day_display": "Monday",
  "tiered_period": {
    "id": 7,
    "name": "Period 1",
    "start_time": "07:45",
    "end_time": "08:45",
    "duration_minutes": 60,
    "period_type": "ACADEMIC"
  },
  "year_group": { "id": 9, "name": "Year 9", "tier": "KS3" },
  "teacher": { "id": 5, "full_name": "Mr. Hassan", "code": "5" },
  "subject": { "code": "ENG", "full_name": "English", "category": "Core" },
  "room": { "id": 3, "name": "Room 5", "is_lab": false },
  "is_practical": false,
  "raw_cell_code": "ENG5"
}
```

#### `LiveLocatorSerializer` response:
```json
{
  "teacher_id": 5,
  "teacher_name": "Mr. Hassan",
  "status": "IN_CLASS",
  "location": "Room 5",
  "context": {
    "subject": "English",
    "year_group": "Year 9",
    "period": "Period 1",
    "ends_at": "08:45"
  },
  "queried_at": "2026-06-18T08:12:00+03:00"
}
```

### 6.3 Conflict Detection Endpoint

The `/api/timetable/conflicts/` endpoint runs a read-only validation pass across the entire current timetable and returns a structured conflict report — useful for admin review before publishing to staff and students.

```json
{
  "total_conflicts": 2,
  "conflicts": [
    {
      "type": "TEACHER_CLASH",
      "teacher_id": 1,
      "teacher_name": "Mr. Ahmed",
      "day": "Wednesday",
      "period": "Period 3 (10:30–11:20)",
      "entry_a": { "year_group": "Year 7", "subject": "MATH" },
      "entry_b": { "year_group": "Year 8", "subject": "MATH" }
    }
  ]
}
```

---

## 7. Frontend Implementation Plan

### 7.1 Angular Library Structure

```
libs/frontend/timetable-matrix/
├── src/
│   ├── index.ts                          # Public API exports
│   └── lib/
│       ├── models/
│       │   ├── bell-schedule.model.ts    # BellSchedule, TieredPeriod interfaces
│       │   ├── timetable-entry.model.ts  # TimetableEntry, SubjectCode, Room interfaces
│       │   └── live-status.model.ts      # LiveLocatorResponse, TeacherStatus enum
│       │
│       ├── services/
│       │   ├── timetable-api.service.ts  # HTTP calls to Django API
│       │   ├── live-tracker.service.ts   # WebSocket / polling for live location
│       │   └── timetable-state.service.ts# Signal-based state management
│       │
│       └── components/
│           ├── timetable-grid/
│           │   ├── timetable-grid.component.ts   # Standalone, dynamic slot grid
│           │   ├── timetable-grid.component.html
│           │   └── timetable-grid.component.spec.ts
│           ├── period-cell/
│           │   ├── period-cell.component.ts       # Individual cell with status badge
│           │   └── period-cell.component.html
│           ├── live-status-badge/
│           │   ├── live-status-badge.component.ts # IN_CLASS pulse / AVAILABLE indicator
│           │   └── live-status-badge.component.html
│           └── staff-locator-panel/
│               ├── staff-locator-panel.component.ts  # Admin dashboard panel
│               └── staff-locator-panel.component.html
```

### 7.2 Core Models — TypeScript Interfaces

```typescript
// models/bell-schedule.model.ts

export type PeriodType = 'ACADEMIC' | 'INSTITUTIONAL' | 'BREAK' | 'TRANSITION';
export type AcademicTier = 'EYF' | 'KS1' | 'KS2' | 'KS3';

export interface TieredPeriod {
  id: number;
  name: string;
  sequence: number;
  start_time: string;        // "07:45"
  end_time: string;          // "08:45"
  duration_minutes: number;  // 60
  period_type: PeriodType;
  is_assignable: boolean;
}

export interface BellSchedule {
  id: number;
  name: string;
  tier: AcademicTier;
  applies_on_days: number[];
  periods: TieredPeriod[];
}

// models/timetable-entry.model.ts

export interface TimetableEntry {
  id: number;
  day_of_week: number;       // 0 = Monday
  day_display: string;
  tiered_period: TieredPeriod;
  year_group: { id: number; name: string; tier: AcademicTier };
  teacher: { id: number; full_name: string };
  subject: { code: string; full_name: string; category: string };
  room: { id: number; name: string; is_lab: boolean };
  is_practical: boolean;
}

// models/live-status.model.ts

export type TeacherStatus = 'IN_CLASS' | 'AVAILABLE' | 'INSTITUTIONAL_BLOCK' | 'RESTRICTED';

export interface LiveLocatorResponse {
  teacher_id: number;
  teacher_name: string;
  status: TeacherStatus;
  location: string;
  context: {
    subject?: string;
    year_group?: string;
    period?: string;
    ends_at?: string;
  } | null;
  queried_at: string;
}
```

### 7.3 Signal-Based State Service

```typescript
// services/timetable-state.service.ts

import { Injectable, computed, signal } from '@angular/core';
import { TimetableEntry, BellSchedule } from '../models';

@Injectable({ providedIn: 'root' })
export class TimetableStateService {

  // Raw state signals
  private _entries       = signal<TimetableEntry[]>([]);
  private _bellSchedule  = signal<BellSchedule | null>(null);
  private _selectedDay   = signal<number>(new Date().getDay() - 1); // 0=Mon
  private _loading       = signal(false);
  private _error         = signal<string | null>(null);

  // Public readonly signals
  readonly entries      = this._entries.asReadonly();
  readonly bellSchedule = this._bellSchedule.asReadonly();
  readonly selectedDay  = this._selectedDay.asReadonly();
  readonly loading      = this._loading.asReadonly();

  // Computed: periods for the active schedule (drives grid row generation)
  readonly activePeriods = computed(() => {
    const schedule = this._bellSchedule();
    const day = this._selectedDay();
    if (!schedule) return [];
    // Filter to periods that match the selected day pattern
    return schedule.periods.filter(p => 
      schedule.applies_on_days.includes(day)
    );
  });

  // Computed: entries grouped as a grid map { periodId → DayIndex → Entry }
  readonly gridMap = computed(() => {
    const map = new Map<number, Map<number, TimetableEntry>>();
    for (const entry of this._entries()) {
      if (!map.has(entry.tiered_period.id)) {
        map.set(entry.tiered_period.id, new Map());
      }
      map.get(entry.tiered_period.id)!.set(entry.day_of_week, entry);
    }
    return map;
  });

  // Mutations
  setEntries(entries: TimetableEntry[])         { this._entries.set(entries); }
  setBellSchedule(schedule: BellSchedule | null) { this._bellSchedule.set(schedule); }
  setSelectedDay(day: number)                    { this._selectedDay.set(day); }
  setLoading(v: boolean)                         { this._loading.set(v); }
}
```

### 7.4 Timetable Grid Component

```typescript
// components/timetable-grid/timetable-grid.component.ts

import {
  Component, Input, OnInit, ChangeDetectionStrategy, inject, computed, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TimetableStateService } from '../../services/timetable-state.service';
import { TimetableApiService } from '../../services/timetable-api.service';
import { PeriodCellComponent } from '../period-cell/period-cell.component';
import { TieredPeriod } from '../../models';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

@Component({
  selector: 'app-timetable-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScrollingModule, PeriodCellComponent],
  template: `
    <div class="timetable-container bg-slate-950 text-white font-mono rounded-xl overflow-hidden shadow-2xl">

      <!-- Day Header Row -->
      <div class="grid sticky top-0 z-10 bg-slate-900 border-b border-slate-700"
           [style.grid-template-columns]="gridCols()">
        <div class="p-3 text-xs text-slate-500 uppercase tracking-widest">Time</div>
        @for (day of days; track day; let i = $index) {
          <div class="p-3 text-center text-xs font-semibold uppercase tracking-wider"
               [class.text-emerald-400]="i === selectedDay()"
               [class.text-slate-400]="i !== selectedDay()">
            {{ day }}
          </div>
        }
      </div>

      <!-- Virtual-Scrolled Period Rows -->
      <cdk-virtual-scroll-viewport itemSize="72" class="h-[70vh]">
        @for (period of activePeriods(); track period.id) {
          <div class="grid border-b border-slate-800 hover:bg-slate-900/40 transition-colors"
               [style.grid-template-columns]="gridCols()"
               [class.bg-slate-900/20]="period.period_type === 'INSTITUTIONAL'"
               [class.bg-amber-950/20]="period.period_type === 'BREAK'">

            <!-- Time Axis Cell -->
            <div class="p-3 border-r border-slate-800 flex flex-col justify-center min-h-[72px]">
              <span class="text-xs text-slate-300 font-medium">{{ period.start_time }}</span>
              <span class="text-[10px] text-slate-600 mt-0.5">{{ period.end_time }}</span>
              <span class="text-[9px] text-slate-700 mt-1">{{ period.duration_minutes }}m</span>

              @if (period.period_type !== 'ACADEMIC') {
                <span class="mt-1 text-[9px] px-1.5 py-0.5 rounded-full text-center font-semibold"
                      [class.bg-amber-900/60]="period.period_type === 'BREAK'"
                      [class.text-amber-400]="period.period_type === 'BREAK'"
                      [class.bg-indigo-900/60]="period.period_type === 'INSTITUTIONAL'"
                      [class.text-indigo-400]="period.period_type === 'INSTITUTIONAL'">
                  {{ period.name }}
                </span>
              }
            </div>

            <!-- Entry Cells (one per day) -->
            @for (dayIndex of [0,1,2,3,4]; track dayIndex) {
              <app-period-cell
                [entry]="getEntry(period.id, dayIndex)"
                [period]="period"
                [isToday]="dayIndex === todayIndex"
                [isSelected]="dayIndex === selectedDay()">
              </app-period-cell>
            }
          </div>
        }
      </cdk-virtual-scroll-viewport>
    </div>
  `
})
export class TimetableGridComponent implements OnInit {
  @Input() yearGroupId?: number;
  @Input() teacherId?: number;

  private state = inject(TimetableStateService);
  private api   = inject(TimetableApiService);

  protected days         = DAYS;
  protected activePeriods = this.state.activePeriods;
  protected selectedDay   = this.state.selectedDay;
  protected todayIndex    = new Date().getDay() - 1;

  protected gridCols = computed(() => `160px repeat(5, 1fr)`);

  ngOnInit() {
    this.loadTimetable();
  }

  protected getEntry(periodId: number, dayIndex: number) {
    return this.state.gridMap().get(periodId)?.get(dayIndex) ?? null;
  }

  private loadTimetable() {
    this.state.setLoading(true);
    const obs = this.teacherId
      ? this.api.getTeacherTimetable(this.teacherId)
      : this.api.getYearGroupTimetable(this.yearGroupId!);

    obs.subscribe({
      next: ({ entries, schedule }) => {
        this.state.setEntries(entries);
        this.state.setBellSchedule(schedule);
        this.state.setLoading(false);
      },
      error: () => this.state.setLoading(false)
    });
  }
}
```

### 7.5 Period Cell Component with Status Animation

```typescript
// components/period-cell/period-cell.component.ts

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableEntry, TieredPeriod } from '../../models';

@Component({
  selector: 'app-period-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="relative p-2 min-h-[72px] border-r border-slate-800 flex flex-col justify-center transition-all duration-200"
         [class.bg-slate-950]="!isSelected && !isToday"
         [class.bg-slate-900/50]="isSelected && !isToday"
         [class.bg-emerald-950/30]="isToday">

      @if (entry) {
        <!-- Subject Badge -->
        <div class="flex items-start gap-1.5">
          <span class="w-1 self-stretch rounded-full flex-shrink-0"
                [ngStyle]="{'background-color': subjectColor()}"></span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[11px] font-bold tracking-wide truncate"
                    [ngStyle]="{'color': subjectColor()}">
                {{ entry.subject.code }}
              </span>
              @if (entry.is_practical) {
                <span class="text-[8px] bg-orange-900/60 text-orange-400 px-1 py-0.5 rounded font-semibold">
                  PRAC
                </span>
              }
            </div>
            <div class="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
              {{ entry.subject.full_name }}
            </div>
            <div class="text-[9px] text-slate-600 mt-1 flex items-center gap-1">
              <span>T{{ entry.teacher.id }}</span>
              <span>·</span>
              <span>{{ entry.room.name }}</span>
            </div>
          </div>
        </div>
      } @else if (period.period_type === 'INSTITUTIONAL') {
        <!-- Institutional block display -->
        <div class="text-center">
          <span class="text-[10px] text-indigo-400/60 uppercase tracking-widest">
            {{ period.name }}
          </span>
        </div>
      } @else if (period.period_type === 'BREAK') {
        <div class="text-center">
          <span class="text-[10px] text-amber-600/50 uppercase tracking-widest">break</span>
        </div>
      } @else {
        <!-- Empty assignable slot -->
        <div class="text-center">
          <span class="text-[10px] text-slate-800">—</span>
        </div>
      }
    </div>
  `
})
export class PeriodCellComponent {
  @Input() entry: TimetableEntry | null = null;
  @Input() period!: TieredPeriod;
  @Input() isToday = false;
  @Input() isSelected = false;

  // Consistent colour per subject category
  protected subjectColor(): string {
    if (!this.entry) return '#475569';
    const colors: Record<string, string> = {
      Core:        '#34d399',  // emerald
      Islamic:     '#818cf8',  // indigo
      Science:     '#38bdf8',  // sky
      Humanities:  '#fb923c',  // orange
      Technical:   '#f472b6',  // pink
      Creative:    '#facc15',  // yellow
      Sport:       '#4ade80',  // green
      Language:    '#a78bfa',  // violet
      Literacy:    '#6ee7b7',  // light emerald
    };
    return colors[this.entry.subject.category] ?? '#94a3b8';
  }
}
```

### 7.6 Live Status Badge Component (with Pulsing Animation)

```typescript
// components/live-status-badge/live-status-badge.component.ts

import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveTrackerService } from '../../services/live-tracker.service';
import { LiveLocatorResponse, TeacherStatus } from '../../models';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-live-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styles: [`
    @keyframes pulse-ring {
      0%   { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2);   opacity: 0; }
    }
    .pulse-ring {
      animation: pulse-ring 1.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
  `],
  template: `
    @if (status()) {
      <div class="flex items-center gap-3 p-3 rounded-lg border"
           [class.border-emerald-800]="status()!.status === 'IN_CLASS'"
           [class.bg-emerald-950/40]="status()!.status === 'IN_CLASS'"
           [class.border-slate-700]="status()!.status === 'AVAILABLE'"
           [class.bg-slate-900]="status()!.status === 'AVAILABLE'"
           [class.border-indigo-800]="status()!.status === 'INSTITUTIONAL_BLOCK'"
           [class.bg-indigo-950/30]="status()!.status === 'INSTITUTIONAL_BLOCK'">

        <!-- Status Indicator -->
        <div class="relative flex-shrink-0">
          @if (status()!.status === 'IN_CLASS') {
            <!-- Pulsing green dot for IN_CLASS -->
            <div class="relative h-3 w-3">
              <div class="pulse-ring absolute inset-0 rounded-full bg-emerald-500 opacity-75"></div>
              <div class="relative h-3 w-3 rounded-full bg-emerald-400"></div>
            </div>
          } @else if (status()!.status === 'AVAILABLE') {
            <div class="h-3 w-3 rounded-full bg-slate-500"></div>
          } @else {
            <div class="h-3 w-3 rounded-full bg-indigo-400"></div>
          }
        </div>

        <!-- Status Text -->
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold uppercase tracking-wide"
               [class.text-emerald-400]="status()!.status === 'IN_CLASS'"
               [class.text-slate-400]="status()!.status === 'AVAILABLE'"
               [class.text-indigo-400]="status()!.status === 'INSTITUTIONAL_BLOCK'">
            {{ statusLabel() }}
          </div>

          <div class="text-[11px] text-slate-400 mt-0.5 truncate">
            {{ status()!.location }}
          </div>

          @if (status()!.context?.subject) {
            <div class="text-[10px] text-slate-600 mt-0.5">
              {{ status()!.context!.subject }} · {{ status()!.context!.year_group }}
              @if (status()!.context?.ends_at) {
                · until {{ status()!.context!.ends_at }}
              }
            </div>
          }
        </div>

        <!-- Live indicator -->
        @if (status()!.status === 'IN_CLASS') {
          <span class="text-[9px] text-emerald-600 font-semibold uppercase tracking-widest flex-shrink-0">
            Live
          </span>
        }
      </div>
    } @else {
      <!-- Loading skeleton -->
      <div class="h-16 rounded-lg bg-slate-800 animate-pulse"></div>
    }
  `
})
export class LiveStatusBadgeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) teacherId!: number;
  @Input() pollingIntervalMs = 30_000; // Poll every 30 seconds

  protected status = signal<LiveLocatorResponse | null>(null);

  private tracker  = inject(LiveTrackerService);
  private sub?: Subscription;

  ngOnInit() {
    // Initial fetch + polling
    this.sub = interval(this.pollingIntervalMs).pipe(
      switchMap(() => this.tracker.getTeacherStatus(this.teacherId))
    ).subscribe(s => this.status.set(s));

    // Immediate first load
    this.tracker.getTeacherStatus(this.teacherId).subscribe(s => this.status.set(s));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  protected statusLabel(): string {
    switch (this.status()?.status) {
      case 'IN_CLASS':           return 'In Class';
      case 'AVAILABLE':          return 'Available';
      case 'INSTITUTIONAL_BLOCK': return 'Assembly / Prayer';
      case 'RESTRICTED':         return 'Restricted';
      default:                   return '—';
    }
  }
}
```

---

## 8. Real-Time Live Tracking Architecture

### 8.1 WebSocket vs Polling Decision

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Pure polling (30s interval) | Simple, no infra | 30s lag, extra DB load | **Use as fallback / MVP** |
| Server-Sent Events (SSE) | Simple, one-way, HTTP-compatible | No browser → server push | Suitable for location updates |
| WebSocket (Django Channels) | Bidirectional, real-time | Redis required, more complex | **Use for admin live dashboard** |

**Decision:** Ship with 30-second polling for the initial live locator (sufficient for "where is the teacher now" use case), upgrade to SSE for the admin dashboard, then WebSocket if real-time sub-10-second tracking is required.

### 8.2 Django Channels Configuration

```python
# settings.py — Production

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get("REDIS_URL", "redis://localhost:6379")],
            "capacity": 1500,
            "expiry": 60,
        },
    }
}

# Channel naming convention:
# "location_{school_id}_{teacher_id}" — scoped by school and teacher
# "timetable_updates_{school_id}"     — for admin dashboard live refresh
```

### 8.3 Privacy & Security Controls

```
Request: GET /api/timetable/locate/{teacher_id}/
         Authorization: Bearer {jwt}

→ Validate JWT → extract school_id, user role
→ Check TeacherTrackingPreference for teacher_id
→ Enforce: student → is_visible_to_students, admin → is_visible_to_admin
→ Check tracking_window_start ≤ now ≤ tracking_window_end
→ Write TeacherLocationAudit row
→ Query TimetableEntry for current time
→ Return structured response
```

---

## 9. Monorepo File Structure

Complete annotated Nx monorepo structure for the timetable module integration:

```
apps/
├── school-core-api/                     # Django REST Framework gateway
│   ├── settings.py                      # Add CHANNEL_LAYERS, USE_REDIS_CHANNEL_LAYER
│   ├── urls.py                          # Include timetable.urls
│   └── asgi.py                          # Django Channels ASGI configuration
│
└── school-admin-portal/                 # Angular Enterprise SPA
    └── src/
        └── app/
            └── features/
                └── timetable/           # Feature module (lazy-loaded route)
                    ├── timetable.routes.ts
                    └── pages/
                        ├── timetable-view.page.ts    # Read-only class/teacher view
                        ├── timetable-admin.page.ts   # Admin drag-and-drop edit
                        └── staff-locator.page.ts     # Live location dashboard

libs/
├── backend/
│   └── timetable/                       # See Section 4.1 for full breakdown
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── filters.py
│       ├── permissions.py
│       ├── admin.py
│       └── engine/
│           ├── parser.py
│           ├── validators.py
│           ├── solver.py
│           ├── locator.py
│           └── scheduler.py
│
└── frontend/
    └── timetable-matrix/                # Shareable Angular library
        └── src/
            └── lib/
                ├── models/
                ├── services/
                └── components/
                    ├── timetable-grid/
                    ├── period-cell/
                    ├── live-status-badge/
                    └── staff-locator-panel/
```

---

## 10. Implementation Phases & Timeline

### Phase 0 — Foundation Repair (Week 1–2)
> Pre-requisite. Nothing else can proceed without this.

- [ ] Create `School` model (not singleton `SchoolInfo`)
- [ ] Add `school = FK(School)` to every scheduling model
- [ ] Add `school_id` claim to JWT + tenant filter backend
- [ ] Migrate `ClassPeriod` time fields to support range overlap queries
- [ ] Add GiST index on period time range
- [ ] Fix `pk=None` bug in `TimetableSlot.clean()`
- [ ] Wrap all scheduling writes in `transaction.atomic()` + `select_for_update()`
- [ ] Replace `InMemoryChannelLayer` with Redis in production settings

**Deliverable:** A tenant-safe, race-condition-free scheduling foundation.

### Phase 1 — Bell Schedule Domain (Week 3)

- [ ] Implement `BellSchedule`, `TieredPeriod`, `InstitutionalBlock` models
- [ ] Write management command `seed_bell_schedules` — seeds all 5 Mnara bell templates from analysis in Section 1.2
- [ ] Implement `SubjectCode` lookup table and seed all codes from Section 3.2
- [ ] Implement `Room` model
- [ ] Write and test `engine/parser.py` for all compound code patterns
- [ ] Admin registrations with inline `TieredPeriod` editing

**Deliverable:** Bell schedules are live in the database matching the PDF exactly.

### Phase 2 — Core Timetable Entry Engine (Week 4)

- [ ] Implement `TimetableEntry` model with all constraints
- [ ] Implement `engine/validators.py` (separate from model)
- [ ] Write management command `import_timetable` — parses the PDF data into `TimetableEntry` rows
- [ ] Full constraint test suite: teacher clash, room clash, year group clash, institutional block protection
- [ ] Conflict detection endpoint (`/api/timetable/conflicts/`)
- [ ] CRUD ViewSets with RBAC (Admin write, Teacher/Student read-only)

**Deliverable:** The existing Mnara Term 3 timetable fully represented in the database, validated and queryable.

### Phase 3 — Angular Interactive Grid (Week 5)

- [ ] Create `libs/frontend/timetable-matrix/` Nx library
- [ ] Implement TypeScript models and interfaces
- [ ] `TimetableStateService` with Signal architecture
- [ ] `TimetableGridComponent` — dynamic slot grid driven by bell schedule (no hardcoded 10-slot array)
- [ ] `PeriodCellComponent` — colour-coded by subject category, practical badges
- [ ] Virtual scrolling with `@angular/cdk/scrolling`
- [ ] `trackBy` on all loops, `OnPush` change detection
- [ ] Activate admin timetable route (currently commented out)
- [ ] Student and teacher views using shared library (eliminate code duplication)

**Deliverable:** A fully dynamic Angular grid that correctly renders variable-duration slots for all 5 bell schedule templates.

### Phase 4 — Live Tracking & Staff Locator (Week 6)

- [ ] `TeacherTrackingPreference` model + admin UI
- [ ] `TeacherLocationAudit` logging on every live lookup
- [ ] `engine/locator.py` with privacy enforcement
- [ ] Live locator API endpoint
- [ ] `LiveStatusBadgeComponent` with pulsing animation for `IN_CLASS`
- [ ] `StaffLocatorPanelComponent` — admin dashboard showing all staff status
- [ ] 30-second polling for MVP, SSE upgrade for admin dashboard
- [ ] Row-level ownership enforcement on all endpoints

**Deliverable:** Admin can see all teacher locations in real time. Teachers can see their own. Students are scoped to their assigned teachers only.

### Phase 5 — CSP Auto-Generator (Week 7–8)

- [ ] Implement `engine/solver.py` — AC-3 + backtracking CSP solver
- [ ] Define `Variable` domain from curriculum requirements
- [ ] Integrate soft constraints (workload balance, subject spread)
- [ ] `POST /api/timetable/generate/` endpoint — triggers solver, stores result
- [ ] Admin UI: "Generate Timetable" button with conflict report output
- [ ] Manual override: drag-and-drop edits on generated timetable (re-validates on drop)

**Deliverable:** Admin can generate a complete conflict-free timetable from curriculum requirements in one click.

---

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CSP solver finds no solution (over-constrained) | Medium | High | Expose which constraints are irresolvable; allow soft constraint relaxation mode |
| Race condition on concurrent admin writes | High (pre-Phase 0) | High | `select_for_update()` + `transaction.atomic()` in Phase 0 |
| Friday bell schedule mismatch (EYF vs KS3) | Medium | Medium | Separate `BellSchedule` objects per tier, Friday explicitly modelled |
| Compound code parser fails on edge cases | Low | Medium | Fuzz test `parser.py` against all 200+ raw cell values from the PDF |
| Redis unavailable in production | Low | High | Fallback to polling; alert when channel layer is InMemory in non-debug mode |
| Teacher tracking privacy violation | Medium | Critical | Audit log on every read; `is_visible_*` flags checked before any response |
| Angular virtual scroll breaking with dynamic slot heights | Medium | Medium | Set `itemSize` to the maximum possible slot height; use `AutoSizeVirtualScrollStrategy` if needed |
| Multi-tenancy migration causes data loss | Low | Critical | Run migration in a transaction on a staging DB snapshot first; use `CONCURRENTLY` for index creation |

---

## Appendix A — Mnara Bell Schedule Summary Card

| Schedule | Tier | Days | Period Lengths | Total Academic Periods |
|----------|------|------|---------------|------------------------|
| EYF KG1/KG2 | EYF | Mon–Fri | 20, 40, 40, 30, 40, 40, 40 | 6 |
| EYF Reception | EYF | Mon–Fri | 40, 40, 30, 40, 40, 40, 40, 40 | 7 |
| KS1/KS2 Mon–Thu | KS1, KS2 | Mon–Thu | 40, 40, 50, 50, 50, 50, 50 | 7 |
| KS3 Mon–Thu | KS3 | Mon–Thu | 60, 60, 40, 45, 40, 45, 45 | 7 |
| All KS2+KS3 Friday | KS2, KS3 | Fri only | 60, 60, 45, 45 | 4 + Prayer/Activities |

## Appendix B — Teacher Cross-Reference (from PDF)

> The following teachers teach across multiple year groups. This is critical for conflict detection — the same teacher ID cannot appear in two cells on the same day at the same time.

| Teacher ID | Subjects | Year Groups Observed |
|------------|----------|---------------------|
| 1 | MATH, MAT | Y7, Y8, Y10 |
| 2 | HIST, PE, GEO | Y3–Y10 (PE specialist), Y4, Y6, Y8, Y9 |
| 3 | SCIE, CHEM, BIO | Y3–Y10 |
| 4 | MATH, CHEM, PHY | Y9, Y10 |
| 5 | ENG | Y5, Y7, Y9 |
| 6 | ENG, MAT | Y6, Y8, Y10 |
| 8 | ART | Y1–Y10 (school-wide art) |
| 9 | ICT | Y1–Y10 (school-wide ICT) |
| 13 | ARA, ARAB | Y7, Y8, Y9, Y10 |
| 16 | ARABIC, ARAB | KG1, KG2, Y1, Y2 |
| 17 | ARA | Y3, Y4, Y5, Y6 |
| 20 | GEO, ECON | Y3, Y7, Y8, Y9, Y10 |

> **Note:** Teachers 8, 9, and 20 appear across the most year groups and are therefore the highest-risk sources of scheduling conflicts. The CSP solver must treat their time slots as the tightest constraints and assign them first.

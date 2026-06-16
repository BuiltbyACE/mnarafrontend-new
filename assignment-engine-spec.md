# Assignment Management Engine — Full Engineering Specification
**School Management System | LMS Module**
**Version:** 1.0 — Development Reference
**Status:** Active Build Target

---

## Table of Contents

1. [System Overview & Philosophy](#1-system-overview--philosophy)
2. [Architecture Map](#2-architecture-map)
3. [Data Model — Complete Schema](#3-data-model--complete-schema)
4. [Assignment Lifecycle — State Machine](#4-assignment-lifecycle--state-machine)
5. [Teacher Flows — Complete](#5-teacher-flows--complete)
6. [Student Flows — Complete](#6-student-flows--complete)
7. [Deadline Engine](#7-deadline-engine)
8. [Auto-Grading Engine](#8-auto-grading-engine)
9. [Notification System](#9-notification-system)
10. [Security & Payload Hardening](#10-security--payload-hardening)
11. [API Contract — Full Endpoint Reference](#11-api-contract--full-endpoint-reference)
12. [Gap Fixes — Priority Queue](#12-gap-fixes--priority-queue)
13. [Frontend UI Contracts](#13-frontend-ui-contracts)
14. [Implementation Order](#14-implementation-order)

---

## 1. System Overview & Philosophy

### What This Engine Does

The Assignment Management Engine handles the complete lifecycle of academic work between teachers and students — from assignment creation through submission, grading, and feedback — inside a school management platform targeting Kenyan secondary schools.

### Core Design Principles

**Principle 1 — Teacher Time is Scarce**
Every flow that touches a teacher must reduce keystrokes. Auto-grading on MCQs must be zero-touch. Submission review must be scannable, not paginated.

**Principle 2 — Deadlines Are Contracts**
Once a deadline passes, the system enforces it automatically. No student submits late without a teacher explicitly granting an extension. This is non-negotiable for academic integrity.

**Principle 3 — Notifications Are the Glue**
Every state transition emits a notification to the relevant actor. Missed notification = missed action. The notification system is not an afterthought — it is the communication backbone.

**Principle 4 — Mobile-First Submission**
Students submit on phones. File uploads must accept smartphone camera JPEGs. Text submissions use a simple editor, not a heavy framework. MCQ interfaces render cleanly on 360px viewports.

**Principle 5 — Offline Resilience**
Draft saves must work client-side before hitting the server. If a student loses network mid-quiz, their answers must survive in `localStorage` until they reconnect.

---

## 2. Architecture Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     TEACHER PORTAL (MFE 4202)                   │
│  Create Assignment → View Submissions → Grade → Push Feedback   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST + WebSocket
┌─────────────────────────▼───────────────────────────────────────┐
│                     DJANGO REST API                             │
│                                                                 │
│  apps/assignments/                                              │
│  ├── models.py          Assignment, AssignmentSubmission        │
│  ├── views.py           CRUD + Submit + Grade endpoints         │
│  ├── serializers.py     Input validation, answer stripping      │
│  ├── tasks.py           Celery: deadline lockout, alerts        │
│  ├── signals.py         Django signals → Notification fan-out  │
│  └── permissions.py     Role-gate: TEACHER / STUDENT           │
│                                                                 │
│  apps/notifications/                                            │
│  ├── models.py          Notification (polymorphic targets)      │
│  ├── channels.py        In-app | Email | SMS dispatcher         │
│  └── tasks.py           Async delivery workers                  │
└────────┬──────────────────────┬────────────────────────────────┘
         │                      │
┌────────▼─────────┐  ┌────────▼──────────┐
│   PostgreSQL     │  │   Celery + Redis   │
│   (main store)   │  │   Beat Scheduler   │
│                  │  │   every 5 minutes: │
│  Assignment      │  │   - deadline check │
│  Submission      │  │   - notification   │
│  Notification    │  │     retry queue    │
└──────────────────┘  └───────────────────┘
         │
┌────────▼──────────────────────────────────────────────────────┐
│                   STUDENT PORTAL (MFE 4201)                   │
│  Browse Assignments → Submit → View Score → See Feedback      │
└───────────────────────────────────────────────────────────────┘
```

### Key Dependency: CourseWorkspace

Assignments are scoped through `CourseWorkspace`, which chains:

```
CourseWorkspace → ClassRoom → enrolled Students
                → Subject
                → Term
```

When a teacher creates an assignment, they pick a `CourseWorkspace`. The system derives the target class, subject, and student roster automatically — teachers never manually select individual students.

---

## 3. Data Model — Complete Schema

### 3.1 Assignment Model

```python
# apps/assignments/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError


class Assignment(models.Model):

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        CLOSED = 'CLOSED', 'Closed'

    class SubmissionType(models.TextChoices):
        QUIZ = 'QUIZ', 'Quiz'
        ONLINE_TEXT = 'ONLINE_TEXT', 'Online Text'
        FILE_UPLOAD = 'FILE_UPLOAD', 'File Upload'
        PHYSICAL = 'PHYSICAL', 'Physical Submission'

    # Identity
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Ownership & Scope
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assignments_created',
        limit_choices_to={'role': 'TEACHER'}
    )
    course = models.ForeignKey(
        'academic.CourseWorkspace',
        on_delete=models.CASCADE,
        related_name='assignments'
    )

    # Submission Config
    submission_type = models.CharField(
        max_length=20,
        choices=SubmissionType.choices,
        default=SubmissionType.QUIZ
    )

    # questions_schema — lives in Assignment for QUIZ type only.
    # Schema (array of question objects):
    # [
    #   {
    #     "id": 1,
    #     "type": "MCQ",
    #     "text": "What is photosynthesis?",
    #     "options": ["A process", "A chemical", "A cell", "A organ"],
    #     "correct": 0,        ← INDEX of correct option (0-based)
    #     "points": 5
    #   }
    # ]
    # WARNING: The 'correct' key MUST be stripped from API responses
    # to students. See SecuritySerializer in serializers.py.
    questions_schema = models.JSONField(default=list, blank=True)

    # Scoring
    max_score = models.PositiveIntegerField(default=100)

    # Lifecycle
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.DRAFT
    )
    deadline = models.DateTimeField()

    # Extension support — stores student IDs granted extra time
    # Schema: {"student_id": "ISO8601 new_deadline"}
    deadline_extensions = models.JSONField(default=dict, blank=True)

    # Timestamps
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'deadline']),
            models.Index(fields=['course', 'status']),
        ]

    def __str__(self):
        return f"{self.title} ({self.course})"

    def effective_deadline(self, student=None):
        """Return the deadline applicable to a specific student,
        respecting any individual extensions."""
        if student:
            ext = self.deadline_extensions.get(str(student.id))
            if ext:
                from django.utils.dateparse import parse_datetime
                return parse_datetime(ext)
        return self.deadline

    def is_expired(self, student=None):
        return timezone.now() > self.effective_deadline(student)

    def publish(self):
        """Transition DRAFT → PUBLISHED and record timestamp."""
        if self.status != self.Status.DRAFT:
            raise ValidationError("Only DRAFT assignments can be published.")
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=['status', 'published_at'])

    def close(self):
        """Transition PUBLISHED → CLOSED."""
        self.status = self.Status.CLOSED
        self.save(update_fields=['status'])

    def save(self, *args, **kwargs):
        # Auto-enforce CLOSED if past deadline (belt-and-suspenders guard)
        if self.status == self.Status.PUBLISHED and self.is_expired():
            self.status = self.Status.CLOSED
        super().save(*args, **kwargs)


class AssignmentSubmission(models.Model):
    """
    One submission per student per assignment.
    Supports all four submission types through a polymorphic payload.
    """

    # Core FK
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions',
        limit_choices_to={'role': 'STUDENT'}
    )

    # Submission content (type-specific — only the relevant field is populated)
    answers_payload = models.JSONField(default=dict, blank=True)
    # Schema for QUIZ:
    # {"1": {"type": "MCQ", "answer": 2}, "2": {"type": "MCQ", "answer": 0}}
    # answer = integer index of selected option (matches questions_schema[n].correct)

    submission_text = models.TextField(blank=True)
    # Used for ONLINE_TEXT submissions (Quill rich text as HTML string)

    uploaded_document = models.FileField(
        upload_to='assignments/submissions/%Y/%m/',
        blank=True,
        null=True
    )
    # Used for FILE_UPLOAD submissions — max 5MB, .pdf/.png/.jpg only

    # Scoring
    auto_grade_score = models.PositiveIntegerField(default=0)
    manual_grade_score = models.PositiveIntegerField(default=0)
    score_awarded = models.PositiveIntegerField(default=0)
    # score_awarded = auto_grade_score + manual_grade_score, capped at max_score

    # Grading state
    is_graded = models.BooleanField(default=False)
    is_late = models.BooleanField(default=False)
    teacher_feedback = models.TextField(blank=True)

    # Draft support — allow students to save mid-quiz
    is_draft = models.BooleanField(default=True)

    # Timestamps
    submitted_at = models.DateTimeField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student} → {self.assignment.title}"

    def auto_grade_quiz(self):
        """
        Score MCQ answers against questions_schema.
        Returns computed score (does NOT save — caller saves).
        Capped at assignment.max_score.
        """
        score = 0
        schema = self.assignment.questions_schema

        for question in schema:
            q_id = str(question.get('id'))
            if question.get('type') == 'MCQ' and q_id in self.answers_payload:
                student_answer = self.answers_payload[q_id].get('answer')
                correct_answer = question.get('correct')
                if student_answer == correct_answer:
                    score += question.get('points', 0)

        # Cap: auto-grade alone cannot exceed max_score
        return min(score, self.assignment.max_score)

    def finalize_score(self):
        """
        Combine auto + manual grade. Cap at max_score.
        Call after manual grading is complete.
        """
        raw = self.auto_grade_score + self.manual_grade_score
        self.score_awarded = min(raw, self.assignment.max_score)
        self.save(update_fields=['score_awarded'])
```

### 3.2 Notification Model (apps/notifications/models.py)

```python
class Notification(models.Model):

    class Category(models.TextChoices):
        ASSIGNMENT_PUBLISHED   = 'ASSIGNMENT_PUBLISHED', 'New Assignment'
        SUBMISSION_RECEIVED    = 'SUBMISSION_RECEIVED', 'Submission Received'
        ASSIGNMENT_GRADED      = 'ASSIGNMENT_GRADED', 'Assignment Graded'
        DEADLINE_REMINDER      = 'DEADLINE_REMINDER', 'Deadline Reminder'
        DEADLINE_EXTENDED      = 'DEADLINE_EXTENDED', 'Deadline Extended'
        ASSIGNMENT_CLOSED      = 'ASSIGNMENT_CLOSED', 'Assignment Closed'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    category = models.CharField(max_length=40, choices=Category.choices)
    title = models.CharField(max_length=255)
    body = models.TextField()

    # Link back to the relevant object
    related_assignment = models.ForeignKey(
        'assignments.Assignment',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    related_submission = models.ForeignKey(
        'assignments.AssignmentSubmission',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]
```

---

## 4. Assignment Lifecycle — State Machine

```
                    ┌─────────┐
  Teacher creates   │         │
  ─────────────────►│  DRAFT  │
                    │         │
                    └────┬────┘
                         │ Teacher publishes
                         │ (manual or publish_now=True on create)
                         ▼
                    ┌─────────────┐    Deadline passed
                    │             │────────────────────────────►┐
                    │  PUBLISHED  │    (Celery beat every 5m)   │
                    │             │◄────────────────────────────┘
                    └────┬────────┘    (still PUBLISHED while live)
                         │
                         │ deadline reached → Celery closes it
                         │ OR teacher manually closes it
                         ▼
                    ┌─────────┐
                    │ CLOSED  │ ← no more submissions accepted
                    └─────────┘

Student submission states (per submission record):
  [no record] → DRAFT (saved but not submitted) → SUBMITTED → GRADED
```

### State Transition Rules

| Transition | Who triggers it | Side effects |
|---|---|---|
| DRAFT → PUBLISHED | Teacher (publish toggle or publish button) | Emit `ASSIGNMENT_PUBLISHED` notification to all enrolled students. Schedule deadline reminder (24h before). |
| PUBLISHED → CLOSED | Celery beat OR teacher manual close | Emit `ASSIGNMENT_CLOSED` notification to students who have not submitted. |
| No record → Draft submission | Student (auto-save) | No notification. `is_draft=True`. |
| Draft → Submitted | Student (final submit button) | Validate deadline. Set `is_late`. Run auto-grading if QUIZ. Emit `SUBMISSION_RECEIVED` to teacher. |
| Submitted → Graded | Teacher (grade action) | Set `is_graded=True`. Finalize score. Emit `ASSIGNMENT_GRADED` to student. |

---

## 5. Teacher Flows — Complete

### 5.1 Create Assignment

**Trigger:** Teacher clicks "New Assignment" in portal.

**Form Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| title | text | ✅ | max 255 chars |
| description | rich text | ❌ | shown to students |
| course (workspace) | select | ✅ | populates from teacher's workspaces |
| submission_type | chip selector | ✅ | QUIZ / ONLINE_TEXT / FILE_UPLOAD / PHYSICAL |
| deadline | datetime picker | ✅ | must be in the future |
| max_score | number | ✅ | default 100 |
| publish_now | toggle | ❌ | if true, status = PUBLISHED immediately on save |

**QUIZ-only fields (shown when submission_type = QUIZ):**

Each question has:
- `text` (string) — question body
- `options` (array of 4 strings) — answer choices
- `correct` (integer 0–3) — index of correct option
- `points` (integer) — marks awarded for correct answer

Question builder UI: add/remove questions dynamically. Point values should default to `max_score / question_count`, recalculated on add/remove.

**Backend Endpoint:** `POST /api/v1/lms/assignments/`

**Validation:**
- `deadline` must be `> timezone.now()`
- If `submission_type == QUIZ`, `questions_schema` must have at least 1 question
- Sum of question points should not exceed `max_score` (warn, don't block)

**On success:**
- If `publish_now=True`: triggers `assignment.publish()` → fires `broadcast_assignment_alert` Celery task
- Returns assignment object (with `id`) for redirect to detail view

---

### 5.2 View All Assignments (Teacher Dashboard)

**Endpoint:** `GET /api/v1/lms/assignments/?created_by=me`

**Filter chips in UI:** All | Draft | Published | Closed

**Each assignment card shows:**
- Title, subject, class name
- Submission type badge (QUIZ / FILE / TEXT / PHYSICAL)
- Deadline (with colour coding: green = >24h, amber = <24h, red = closed)
- Submission count: `{submitted_count} / {enrolled_count}`
- Graded count: `{graded_count} / {submitted_count}`

**Sort:** Most recent deadline first by default.

---

### 5.3 Assignment Detail — Submission Review (MISSING — BUILD THIS)

**Endpoint:** `GET /api/v1/lms/assignments/{id}/submissions/`

**Response shape:**
```json
{
  "assignment": {
    "id": 1,
    "title": "Chapter 3 Quiz",
    "submission_type": "QUIZ",
    "max_score": 50,
    "deadline": "2024-10-15T23:59:00Z",
    "status": "CLOSED",
    "enrolled_count": 32,
    "submitted_count": 28,
    "graded_count": 20
  },
  "submissions": [
    {
      "id": 101,
      "student": {"id": 5, "full_name": "Jane Wanjiku", "admission_no": "S042"},
      "submitted_at": "2024-10-15T21:30:00Z",
      "is_late": false,
      "is_graded": true,
      "score_awarded": 44,
      "auto_grade_score": 44,
      "manual_grade_score": 0
    }
  ],
  "not_submitted": [
    {"id": 12, "full_name": "Mark Ochieng", "admission_no": "S017"}
  ]
}
```

**Teacher UI — Submission List Screen:**

Two tabs: **Submitted** (with graded/ungraded filter) and **Not Submitted**.

Each submitted row: student name, submitted time, late badge if `is_late=True`, score bar, "Grade" button (if ungraded) or "View" button (if graded).

Clicking "Grade" or "View" opens a side panel (not a new page — preserves list context).

---

### 5.4 Grading Panel

**For QUIZ submissions:**

The panel shows each question, the student's selected answer, and highlights correct/incorrect options. The `auto_grade_score` is pre-populated. Teacher can add `manual_grade_score` only if there are non-MCQ components (otherwise manual field is hidden).

**For TEXT submissions:**

Quill-rendered read-only view of the student's submission text. Manual score input field (0 to max_score). Feedback text area.

**For FILE submissions:**

Download link / inline preview for .pdf, .jpg, .png. Manual score input. Feedback text area.

**Endpoint:** `POST /api/v1/lms/submissions/{id}/grade/`

**Request body:**
```json
{
  "manual_grade_score": 15,
  "teacher_feedback": "Good analysis, but missed the photosynthesis equation."
}
```

**Backend logic:**
1. Set `manual_grade_score`
2. Call `submission.finalize_score()` — sets `score_awarded`, capped at `max_score`
3. Set `is_graded = True`, `graded_at = timezone.now()`
4. Save
5. Fire `ASSIGNMENT_GRADED` notification to student

---

### 5.5 Extend Deadline for a Student

**Endpoint:** `PATCH /api/v1/lms/assignments/{id}/extend/`

**Request body:**
```json
{
  "student_id": 12,
  "new_deadline": "2024-10-17T23:59:00Z"
}
```

**Backend logic:**
- Validates new deadline is in the future
- Writes `assignment.deadline_extensions[str(student_id)] = new_deadline`
- If assignment was CLOSED but student's effective deadline is now in the future, the submission endpoint will accept their work (deadline check uses `effective_deadline(student)`)
- Fires `DEADLINE_EXTENDED` notification to the student

---

### 5.6 Close Assignment Manually

**Endpoint:** `PATCH /api/v1/lms/assignments/{id}/close/`

Transitions PUBLISHED → CLOSED immediately. Fires `ASSIGNMENT_CLOSED` notification to all enrolled students who have not submitted.

---

## 6. Student Flows — Complete

### 6.1 Browse Assignments

**Endpoint:** `GET /api/v1/lms/assignments/student/`

Returns assignments where `assignment.course.classroom` includes the student's class enrollment, and `assignment.status = PUBLISHED` OR the student has a submission.

**Filter chips:** All | Pending (no submission, not closed) | Submitted | Graded

**Each assignment card shows:**
- Title, subject name
- Submission type badge
- Deadline (countdown if < 24h: "Due in 3h 22m")
- Status pill: PENDING / SUBMITTED / LATE / GRADED
- Score bar (visible once graded): `{score_awarded} / {max_score}`

---

### 6.2 Submit — Quiz

**Pre-flight check (frontend):**
- Load assignment, verify `status == PUBLISHED` and `is_expired(student) == False`
- Render questions WITHOUT the `correct` key (must be stripped server-side — see Security)
- Store answers in `localStorage` keyed by `assignment_{id}_draft` as student selects options
- Show question count progress bar: "4 / 10 answered"

**Submit action:**

`POST /api/v1/lms/assignments/{id}/submit/`

```json
{
  "answers": {
    "1": {"type": "MCQ", "answer": 2},
    "2": {"type": "MCQ", "answer": 0}
  }
}
```

**On success:** Clear localStorage draft. Show score immediately (`auto_graded_points` in response). Disable re-submission.

**Re-submission rule:** Once `is_draft = False`, the submission is locked. A student cannot re-submit unless the teacher resets it (not in v1 scope, but model supports it via `is_draft` toggle).

---

### 6.3 Submit — Text

**Endpoint:** `POST /api/v1/lms/assignments/{id}/submit/`

```json
{
  "submission_text": "<p>The water cycle consists of...</p>"
}
```

**Field name fix:** Backend must accept `submission_text` (current bug: frontend sends `text`, backend expects `submission_text`). **Fix the frontend to send `submission_text`.**

---

### 6.4 Submit — File Upload

**Endpoint:** `POST /api/v1/lms/assignments/{id}/submit/` (multipart form)

Form fields: `document` (file)

**File validation (backend):**
- Max size: 5MB (`request.FILES['document'].size <= 5 * 1024 * 1024`)
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`
- Rename file to `submission_{assignment_id}_{student_id}_{timestamp}.{ext}` on save

---

### 6.5 View Graded Submission

**Endpoint:** `GET /api/v1/lms/submissions/{id}/`

Returns full submission including:
- `score_awarded`, `auto_grade_score`, `manual_grade_score`, `max_score`
- `teacher_feedback`
- For QUIZ: each question with student's answer and whether it was correct (`show_correct_after_grade: true` controlled by assignment config — default true)
- `is_late` flag visible to student

---

## 7. Deadline Engine

### 7.1 Celery Beat Task — Deadline Lockout

Runs every 5 minutes. Closes all PUBLISHED assignments whose deadline has passed and no extension covers them.

```python
# apps/assignments/tasks.py

from celery import shared_task
from django.utils import timezone
from apps.assignments.models import Assignment
from apps.notifications.services import dispatch_notification

@shared_task(name='assignments.enforce_deadlines')
def enforce_assignment_deadlines():
    """
    Close all PUBLISHED assignments past their global deadline.
    Note: assignments with per-student extensions remain PUBLISHED
    until ALL extensions have also passed (handled via effective_deadline
    check on submission endpoint). The global status reflects the global deadline.
    """
    now = timezone.now()
    expired = Assignment.objects.filter(
        status=Assignment.Status.PUBLISHED,
        deadline__lt=now
    )
    closed_ids = list(expired.values_list('id', flat=True))
    expired.update(status=Assignment.Status.CLOSED)

    # Fire ASSIGNMENT_CLOSED notifications for each closed assignment
    for assignment_id in closed_ids:
        notify_closed_assignment.delay(assignment_id)

    return f"Closed {len(closed_ids)} assignments."


@shared_task(name='assignments.notify_closed')
def notify_closed_assignment(assignment_id):
    """
    Notify students who did not submit before the deadline.
    """
    try:
        assignment = Assignment.objects.select_related(
            'course__classroom', 'course__subject'
        ).get(id=assignment_id)
    except Assignment.DoesNotExist:
        return

    submitted_student_ids = assignment.submissions.filter(
        is_draft=False
    ).values_list('student_id', flat=True)

    enrolled_students = assignment.course.classroom.enrollments.exclude(
        student_id__in=submitted_student_ids
    ).select_related('student')

    for enrollment in enrolled_students:
        dispatch_notification(
            recipient=enrollment.student,
            category='ASSIGNMENT_CLOSED',
            title=f"Assignment closed: {assignment.title}",
            body=f"The deadline for '{assignment.title}' has passed and you did not submit.",
            assignment=assignment
        )
```

### 7.2 Deadline Reminder Task

Scheduled at publish time, fires 24h before the deadline.

```python
@shared_task(name='assignments.deadline_reminder')
def send_deadline_reminder(assignment_id):
    """
    Remind students who haven't submitted yet, 24h before deadline.
    """
    try:
        assignment = Assignment.objects.get(id=assignment_id, status=Assignment.Status.PUBLISHED)
    except Assignment.DoesNotExist:
        return  # Assignment was closed or deleted; skip

    submitted_ids = assignment.submissions.filter(is_draft=False).values_list('student_id', flat=True)
    pending_students = assignment.course.classroom.enrollments.exclude(
        student_id__in=submitted_ids
    ).select_related('student')

    for enrollment in pending_students:
        dispatch_notification(
            recipient=enrollment.student,
            category='DEADLINE_REMINDER',
            title=f"Due tomorrow: {assignment.title}",
            body=f"You have until {assignment.deadline.strftime('%d %b %Y at %H:%M')} to submit.",
            assignment=assignment
        )
```

### 7.3 Scheduling the Reminder at Publish Time

```python
# In the publish signal / view, after assignment.publish():

from datetime import timedelta
from assignments.tasks import send_deadline_reminder

reminder_time = assignment.deadline - timedelta(hours=24)
if reminder_time > timezone.now():
    send_deadline_reminder.apply_async(
        args=[assignment.id],
        eta=reminder_time
    )
```

### 7.4 Celery Beat Config (celery.py / settings)

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'enforce-assignment-deadlines': {
        'task': 'assignments.enforce_deadlines',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
}
```

---

## 8. Auto-Grading Engine

### 8.1 Submission Endpoint Logic

```python
# apps/assignments/views.py

class SubmitAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request, assignment_id):
        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({"error": "Assignment not found."}, status=404)

        student = request.user

        # ── Deadline Gate ──────────────────────────────────────────────
        if assignment.status == Assignment.Status.CLOSED:
            # Check if student has a personal extension
            if assignment.is_expired(student=student):
                return Response(
                    {"error": "The deadline for this assignment has passed."},
                    status=400
                )
        elif assignment.status != Assignment.Status.PUBLISHED:
            return Response({"error": "This assignment is not accepting submissions."}, status=400)

        # ── Late Flag ──────────────────────────────────────────────────
        is_late = timezone.now() > assignment.effective_deadline(student)

        # ── Submission Type Routing ────────────────────────────────────
        submission_data = {
            'is_draft': False,
            'is_late': is_late,
            'submitted_at': timezone.now(),
        }

        if assignment.submission_type == Assignment.SubmissionType.QUIZ:
            answers = request.data.get("answers", {})
            submission_data['answers_payload'] = answers

        elif assignment.submission_type == Assignment.SubmissionType.ONLINE_TEXT:
            text = request.data.get("submission_text", "").strip()
            if not text:
                return Response({"error": "submission_text is required."}, status=400)
            submission_data['submission_text'] = text

        elif assignment.submission_type == Assignment.SubmissionType.FILE_UPLOAD:
            doc = request.FILES.get("document")
            if not doc:
                return Response({"error": "A file upload is required."}, status=400)

            # Validate size
            if doc.size > 5 * 1024 * 1024:
                return Response({"error": "File must be under 5MB."}, status=400)

            # Validate type
            allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
            if doc.content_type not in allowed_types:
                return Response({"error": "Only PDF, JPG, and PNG files are accepted."}, status=400)

            submission_data['uploaded_document'] = doc

        elif assignment.submission_type == Assignment.SubmissionType.PHYSICAL:
            # Physical: just mark as submitted, no content
            pass

        # ── Create or update submission ────────────────────────────────
        submission, created = AssignmentSubmission.objects.update_or_create(
            assignment=assignment,
            student=student,
            defaults=submission_data
        )

        # ── Auto-grade if QUIZ ─────────────────────────────────────────
        if assignment.submission_type == Assignment.SubmissionType.QUIZ:
            auto_score = submission.auto_grade_quiz()
            submission.auto_grade_score = auto_score
            submission.score_awarded = auto_score  # manual additions layer on top
            submission.is_graded = True  # QUIZ is auto-graded on submit
            submission.graded_at = timezone.now()
            submission.save()

            # Immediately fire graded notification for QUIZ
            from notifications.tasks import send_graded_notification
            send_graded_notification.delay(submission.id)
        else:
            submission.save()
            # Fire submission received notification to teacher
            from notifications.tasks import send_submission_received_notification
            send_submission_received_notification.delay(submission.id)

        response_data = {
            "message": "Submission received.",
            "submission_id": submission.id,
            "is_late": is_late,
        }
        if assignment.submission_type == Assignment.SubmissionType.QUIZ:
            response_data["score_awarded"] = submission.score_awarded
            response_data["max_score"] = assignment.max_score

        return Response(response_data, status=201 if created else 200)
```

### 8.2 Security: Stripping Correct Answers from Student-Facing Responses

```python
# apps/assignments/serializers.py

class AssignmentStudentSerializer(serializers.ModelSerializer):
    """
    Serializer for student-facing assignment detail.
    Strips 'correct' key from questions_schema to prevent cheating.
    """
    questions_schema = serializers.SerializerMethodField()

    def get_questions_schema(self, obj):
        return [
            {k: v for k, v in q.items() if k != 'correct'}
            for q in obj.questions_schema
        ]

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'submission_type',
            'questions_schema', 'max_score', 'deadline', 'status'
        ]
```

---

## 9. Notification System

### 9.1 Notification Service

```python
# apps/notifications/services.py

from .models import Notification

def dispatch_notification(recipient, category, title, body,
                          assignment=None, submission=None):
    """
    Create in-app notification and trigger async delivery
    (email / SMS) via Celery.
    """
    notif = Notification.objects.create(
        recipient=recipient,
        category=category,
        title=title,
        body=body,
        related_assignment=assignment,
        related_submission=submission,
    )

    # Async: send email
    from .tasks import send_email_notification
    send_email_notification.delay(notif.id)

    return notif
```

### 9.2 Django Signals — Wiring Notifications to Assignment Events

```python
# apps/assignments/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Assignment, AssignmentSubmission


@receiver(post_save, sender=Assignment)
def on_assignment_published(sender, instance, created, **kwargs):
    """Fire broadcast notification when assignment transitions to PUBLISHED."""
    if not created and instance.status == Assignment.Status.PUBLISHED:
        # Only fire if just published (published_at was just set)
        from .tasks import broadcast_assignment_alert
        broadcast_assignment_alert.delay(instance.id)


@receiver(post_save, sender=AssignmentSubmission)
def on_submission_saved(sender, instance, created, **kwargs):
    """Notify teacher when a new non-draft submission arrives."""
    if not instance.is_draft and created:
        if instance.assignment.submission_type != Assignment.SubmissionType.QUIZ:
            from notifications.services import dispatch_notification
            dispatch_notification(
                recipient=instance.assignment.created_by,
                category='SUBMISSION_RECEIVED',
                title=f"New submission: {instance.assignment.title}",
                body=f"{instance.student.get_full_name()} submitted their work.",
                assignment=instance.assignment,
                submission=instance
            )
```

### 9.3 Notification Categories — Full Matrix

| Category | Recipient | Trigger | Channel |
|---|---|---|---|
| `ASSIGNMENT_PUBLISHED` | All enrolled students | Teacher publishes | In-app + Email |
| `DEADLINE_REMINDER` | Students without submission | 24h before deadline | In-app + Email |
| `DEADLINE_EXTENDED` | Specific student | Teacher grants extension | In-app + Email |
| `SUBMISSION_RECEIVED` | Teacher | Student submits (non-QUIZ) | In-app |
| `ASSIGNMENT_GRADED` | Student | Teacher grades submission | In-app + Email |
| `ASSIGNMENT_CLOSED` | Students who didn't submit | Deadline passes | In-app |

### 9.4 Notification Bell API

**Endpoint:** `GET /api/v1/notifications/?unread=true`

Returns unread notification count + last N notifications.

**Endpoint:** `PATCH /api/v1/notifications/{id}/read/`

Marks a notification as read.

**Endpoint:** `PATCH /api/v1/notifications/read-all/`

Marks all as read.

**Frontend:** The bell icon in the sidebar must hit the unread count endpoint on mount and every 60 seconds. Replace hardcoded "3" badge.

---

## 10. Security & Payload Hardening

### 10.1 Correct Answer Stripping

The `correct` key from `questions_schema` must NEVER appear in any API response sent to a student. Use `AssignmentStudentSerializer` exclusively for student-facing endpoints. Teacher endpoints may use the full serializer.

### 10.2 Submission Payload Validation

On quiz submission, validate that:
- All answer keys in `answers_payload` correspond to valid question IDs in `questions_schema`
- Answer values are integers within the valid option index range (0 to `len(options) - 1`)
- Strip any extra keys from the payload before saving

```python
def validate_quiz_answers(answers: dict, questions_schema: list) -> dict:
    """
    Returns cleaned answers dict.
    Raises ValidationError if answers reference non-existent question IDs.
    """
    valid_question_ids = {str(q['id']): q for q in questions_schema}
    cleaned = {}

    for q_id, answer_obj in answers.items():
        if q_id not in valid_question_ids:
            continue  # Silently ignore phantom question IDs
        q = valid_question_ids[q_id]
        student_answer = answer_obj.get('answer')
        max_option_index = len(q.get('options', [])) - 1
        if not isinstance(student_answer, int) or student_answer < 0 or student_answer > max_option_index:
            raise ValidationError(f"Invalid answer for question {q_id}.")
        cleaned[q_id] = {"type": "MCQ", "answer": student_answer}

    return cleaned
```

### 10.3 File Upload Hardening

```python
import magic  # python-magic library for MIME sniffing

ALLOWED_MIME_TYPES = {'application/pdf', 'image/jpeg', 'image/png'}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB

def validate_uploaded_file(file):
    if file.size > MAX_FILE_SIZE_BYTES:
        raise ValidationError("File must be under 5MB.")

    # Read first 2KB for MIME detection (not Content-Type header, which can be spoofed)
    header = file.read(2048)
    file.seek(0)  # Reset for actual save

    mime = magic.from_buffer(header, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise ValidationError(f"File type '{mime}' is not allowed.")
```

### 10.4 Role-Based Permission Guards

```python
# apps/assignments/permissions.py

from rest_framework.permissions import BasePermission

class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'TEACHER'

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'STUDENT'

class IsAssignmentTeacher(BasePermission):
    """Only the teacher who created the assignment can grade/view submissions."""
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user
```

---

## 11. API Contract — Full Endpoint Reference

### Assignments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/lms/assignments/` | Teacher | Create assignment |
| `GET` | `/api/v1/lms/assignments/` | Teacher | List own assignments |
| `GET` | `/api/v1/lms/assignments/{id}/` | Teacher | Assignment detail (full schema) |
| `PATCH` | `/api/v1/lms/assignments/{id}/` | Teacher | Edit draft assignment |
| `DELETE` | `/api/v1/lms/assignments/{id}/` | Teacher | Delete draft assignment only |
| `POST` | `/api/v1/lms/assignments/{id}/publish/` | Teacher | Publish assignment |
| `POST` | `/api/v1/lms/assignments/{id}/close/` | Teacher | Manually close assignment |
| `POST` | `/api/v1/lms/assignments/{id}/extend/` | Teacher | Grant student deadline extension |
| `GET` | `/api/v1/lms/assignments/{id}/submissions/` | Teacher | View all submissions for an assignment |
| `GET` | `/api/v1/lms/assignments/student/` | Student | List assignments for student's class |
| `GET` | `/api/v1/lms/assignments/student/{id}/` | Student | Assignment detail (answers stripped) |

### Submissions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/lms/assignments/{id}/submit/` | Student | Submit assignment |
| `GET` | `/api/v1/lms/submissions/{id}/` | Student | View own submission |
| `POST` | `/api/v1/lms/submissions/{id}/grade/` | Teacher | Grade a submission |
| `GET` | `/api/v1/lms/submissions/{id}/` | Teacher | View full submission (teacher) |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications/` | Any | List notifications for current user |
| `GET` | `/api/v1/notifications/unread-count/` | Any | Fast count for bell badge |
| `PATCH` | `/api/v1/notifications/{id}/read/` | Any | Mark one as read |
| `PATCH` | `/api/v1/notifications/read-all/` | Any | Mark all as read |

---

## 12. Gap Fixes — Priority Queue

Addressing the known gaps in priority order:

### P0 — CRITICAL: Deadline Enforcement on Submit

**Problem:** No deadline check on submission endpoint. Students submit after deadline freely.

**Fix:**

In `SubmitAssignmentView.post()`:
```python
# Check assignment status AND student's effective deadline
if assignment.is_expired(student=student) and assignment.status == Assignment.Status.CLOSED:
    # Check personal extension
    if timezone.now() > assignment.effective_deadline(student=student):
        return Response({"error": "The deadline for this assignment has passed."}, status=400)
```

Also set `is_late = True` on any submission where `timezone.now() > assignment.effective_deadline(student)` regardless of whether the assignment is still technically PUBLISHED.

---

### P0 — CRITICAL: Text Submission Field Mismatch

**Problem:** Frontend sends `{ text }`, backend expects `{ submission_text }` → 400 error on all text submissions.

**Fix (frontend):** Change `text` key to `submission_text` in the text submission payload.

**Fix (backend safety net):** Also accept `text` as an alias temporarily:
```python
text = request.data.get("submission_text") or request.data.get("text", "")
```

---

### P1 — HIGH: Teacher Submission Review Screen

**Problem:** No frontend UI to review submissions. Backend endpoints exist.

**Build:** A dedicated route in the Teacher Portal MFE: `/teacher/assignments/{id}/submissions`

Components needed:
- `SubmissionListView` — table of submissions with status/score
- `GradingPanel` — side drawer that loads individual submission
- `QuizReviewPanel` — shows MCQ question/answer/correct breakdown
- `TextReviewPanel` — Quill read-only + score input
- `FileReviewPanel` — download link + preview + score input

---

### P1 — HIGH: Notification Wiring

**Problem:** `notifications` app exists and has full CRUD but nothing writes to it from LMS events.

**Fix:** Add `signals.py` to `apps/assignments/` (see Section 9.2) and connect it in `apps/assignments/apps.py`:

```python
class AssignmentsConfig(AppConfig):
    name = 'apps.assignments'

    def ready(self):
        import apps.assignments.signals  # noqa — registers signal handlers
```

---

### P2 — MEDIUM: Auto-Grade Cap

**Problem:** If point values on questions sum > `max_score`, `auto_grade_score` can exceed 100%.

**Fix:** In `auto_grade_quiz()`:
```python
return min(score, self.assignment.max_score)
```
Already specified in the model above. Ensure this is the version in production.

---

### P2 — MEDIUM: `is_late` Field on Submission

**Problem:** No `is_late` field — can't distinguish on-time vs late submissions.

**Fix:** Field added to `AssignmentSubmission` model (see Section 3.1). Set it on submit:
```python
is_late = timezone.now() > assignment.effective_deadline(student)
submission.is_late = is_late
```

Generate and run migration: `python manage.py makemigrations && python manage.py migrate`

---

### P2 — MEDIUM: Notification Bell Count

**Problem:** Sidebar shows hardcoded "3" for assignment count.

**Fix:** Replace with API call to `GET /api/v1/notifications/unread-count/` on component mount.

```javascript
// In sidebar component
const { data } = useQuery('/api/v1/notifications/unread-count/');
const unreadCount = data?.count ?? 0;
```

---

## 13. Frontend UI Contracts

### 13.1 Assignment Card — Student

```
┌─────────────────────────────────────────────────┐
│ [QUIZ]                              [PENDING]   │
│ Chapter 3: Cell Biology                          │
│ Biology · Form 3A                               │
│                                                 │
│ ⏱  Due in 4h 22m  (15 Oct, 11:59 PM)           │
│                                                 │
│              [Start Quiz →]                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [FILE]                              [GRADED]    │
│ Term 1 Research Paper                            │
│ History · Form 3A                               │
│                                                 │
│ ████████████░░░░  44 / 50 pts                   │
│ "Good analysis. Work on citations."             │
│                                                 │
│              [View Feedback →]                  │
└─────────────────────────────────────────────────┘
```

### 13.2 Assignment Card — Teacher

```
┌─────────────────────────────────────────────────┐
│ [QUIZ]  Chapter 3: Cell Biology      [CLOSED]   │
│ Biology · Form 3A · Due 15 Oct 11:59 PM         │
│                                                 │
│  Submitted   28 / 32                            │
│  Graded      ████████░░░░  20 / 28              │
│                                                 │
│         [Review Submissions →]                  │
└─────────────────────────────────────────────────┘
```

### 13.3 Submission List (Teacher)

```
Submitted (28)              Not Submitted (4)
──────────────────────────────────────────────────
  NAME             SUBMITTED    LATE   SCORE   ACTION
  Jane Wanjiku     15 Oct 9PM   –      44/50   [View]
  Peter Otieno     15 Oct 11PM  –      38/50   [View]
  Sarah Mutua      16 Oct 1AM   ⚠LATE  –       [Grade]
  …
──────────────────────────────────────────────────
  Mark Ochieng     –            –      –       [Extend]
```

### 13.4 Grading Panel (Side Drawer)

```
┌──────────────────────────────────────────────────┐
│  Sarah Mutua — Chapter 3 Quiz        ⚠ LATE      │
│──────────────────────────────────────────────────│
│  Q1. What is the powerhouse of the cell?         │
│  ○ Nucleus   ● Mitochondria  ○ Ribosome ○ Wall  │
│  ✅ Correct                              5/5 pts  │
│──────────────────────────────────────────────────│
│  Q2. Which organelle synthesizes proteins?       │
│  ● Nucleus   ○ Ribosome  ○ Golgi   ○ Vacuole   │
│  ❌ Incorrect (Correct: Ribosome)        0/5 pts  │
│──────────────────────────────────────────────────│
│  Auto-grade Score:   40 / 50                     │
│  Manual Adjustment:  [___] pts (optional)        │
│──────────────────────────────────────────────────│
│  Feedback for student:                           │
│  ┌────────────────────────────────────────────┐  │
│  │ Good work overall. Review protein synthesis│  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│              [Save Grade]  [Cancel]              │
└──────────────────────────────────────────────────┘
```

---

## 14. Implementation Order

Work through this sequence. Each item is a shippable unit that can be tested independently.

### Sprint 1 — Foundation Fixes (Days 1–3)

1. **Add `is_late` field to `AssignmentSubmission`** → migration
2. **Fix text submission field name** → `submission_text` in frontend + backend alias
3. **Wire deadline enforcement** in `SubmitAssignmentView` → check `effective_deadline(student)`, set `is_late`
4. **Cap auto-grade score** → ensure `min(score, max_score)` in `auto_grade_quiz()`
5. **Write signals.py** for assignment notifications → connect in `apps.py`

### Sprint 2 — Notification Pipeline (Days 4–6)

6. **Build `dispatch_notification()` service**
7. **Build `send_email_notification` Celery task** (simple Django email for now)
8. **Wire `ASSIGNMENT_PUBLISHED` signal** → calls `broadcast_assignment_alert`
9. **Wire `SUBMISSION_RECEIVED` signal** → notifies teacher (non-QUIZ)
10. **Wire `ASSIGNMENT_GRADED` notification** in grade endpoint
11. **Wire `ASSIGNMENT_CLOSED` notification** in Celery deadline task
12. **Build notification bell API** (`/api/v1/notifications/` + unread count)
13. **Replace hardcoded "3" badge** in sidebar with live API count

### Sprint 3 — Teacher Submission Review (Days 7–10)

14. **Backend:** Ensure `GET /api/v1/lms/assignments/{id}/submissions/` returns correct shape (enrolled_count, not_submitted list)
15. **Frontend:** Build `SubmissionListView` route + tab component
16. **Frontend:** Build `GradingPanel` drawer → `QuizReviewPanel`, `TextReviewPanel`, `FileReviewPanel`
17. **Frontend:** Wire `POST /api/v1/lms/submissions/{id}/grade/` from grading panel
18. **Frontend:** Show late badge on submission rows

### Sprint 4 — Deadline Extensions & Hardening (Days 11–13)

19. **Backend:** `PATCH /api/v1/lms/assignments/{id}/extend/` endpoint + deadline_extensions field on model
20. **Frontend:** Teacher can grant extension from "Not Submitted" tab
21. **Backend:** Deadline reminder Celery task scheduled at publish time
22. **Security:** `AssignmentStudentSerializer` strips `correct` keys
23. **Security:** MIME-type file validation with `python-magic`
24. **Security:** Payload validation for quiz answers

### Sprint 5 — Polish & Offline Resilience (Days 14–15)

25. **Student draft save** → quiz answers persist in `localStorage`
26. **Countdown timer** on assignment cards (< 24h)
27. **Empty states** → "No assignments yet" / "All caught up" screens
28. **Late submission badge** visible to students on their submission view

---

## Appendix A — Environment Setup Checklist

- [ ] `celery` + `django-celery-beat` installed and configured
- [ ] Redis running as Celery broker
- [ ] Celery Beat scheduler running: `celery -A config beat -l info`
- [ ] Celery worker running: `celery -A config worker -l info`
- [ ] `python-magic` installed: `pip install python-magic`
- [ ] Email backend configured (`EMAIL_HOST`, `EMAIL_PORT`, etc. in settings)
- [ ] SMS integration (placeholder for now — swap `print()` with Africa's Talking SDK)
- [ ] `signals.py` imported in `AssignmentsConfig.ready()`
- [ ] File upload directory writable: `MEDIA_ROOT/assignments/submissions/`
- [ ] Max upload size set in `settings.py`: `DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880`

---

## Appendix B — Kenyan Market Notes

- **SMS over email for parents.** Parent notifications should route through SMS (Africa's Talking or Safaricom Daraja). Email is secondary.
- **Deadline times.** Default deadline time to 11:59 PM Kenya Time (EAT, UTC+3). Store in UTC internally, display in EAT.
- **Mobile data.** File upload previews in the teacher grading panel should lazy-load. Don't auto-download uploaded documents — show a "View" button that requests on demand.
- **Offline quiz draft.** Students on 2G/3G may lose connection mid-quiz. Draft auto-save to `localStorage` every 30 seconds of answer selection is essential.

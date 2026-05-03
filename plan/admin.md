# Mnara ERP: Admin Portal Integration Contract (v2.0 - Final)
> **Status:** Source of Truth for Angular Frontend Team  
> **Backend:** Django 6.0.4 + DRF + Channels  
> **Last Updated:** May 3, 2026
---
## 1. Global Architectural Rules
### 1.1 Pagination (Strict)
All `GET` list endpoints return paginated responses using the `?page` and `page_size` query parameters.
- **Default:** `?page=1&page_size=20`
- **Response Envelope:**
```json
{
  "count": 105,
  "next": "http://domain.com/api/v1/resource/?page=2",
  "previous": null,
  "results": [ ... ]
}
1.2 Immutability (Soft Deletes)
Physical DELETE requests are rejected at the model level (raising ValidationError).
- To "Delete" a record: Send a PATCH request updating the is_active flag.
PATCH /api/v1/finance/invoices/1/
{ "is_active": false }
1.3 Nested Reads / Flat Writes
- GET (Read): Returns deeply nested objects (e.g., Student contains regular_details object).
- POST/PUT/PATCH (Write): Expects flat relational IDs (e.g., "student": 12, "fee_structure": 3).
---
2. Endpoint Matrix
2.1 /api/v1/accounts/ (Authentication & RBAC)
Endpoint	Method	Description
/users/	GET, POST	User Management (Admin Only)
/users/{id}/	GET, PUT, PATCH, DELETE	Single User Operations
/users/{id}/role/	PATCH	Change User Role
/users/{id}/revoke-access/	POST	Blacklist Tokens + Deactivate
/auth/discover/	POST	Adaptive Auth Discovery
/auth/login/	POST	JWT Login (school_id/email/phone)
/auth/refresh/	POST	Refresh JWT Token
/auth/update-password/	POST	Authenticated Password Update
/me/	GET	Current User Portal Handshake
/auth/me/	GET	Alias for Current User
2.2 /api/v1/academics/ (School Structure)
Endpoint	Method	Description
/departments/	CRUD	Departments (STEM, Humanities)
/key-stages/	CRUD	Key Stages (Early Years, IGCSE)
/year-levels/	CRUD	Year Levels (Year 1, Year 2...)
/subjects/	CRUD	Subject Definitions
/offerings/	CRUD	Subject Offerings per Year Level
/classrooms/	CRUD	Class Streams (Capacity & Teachers)
/students/bulk-promote/	POST	End-of-Year Rollover
2.3 /api/v1/students/ (Admissions & Profiles)
Endpoint	Method	Description
/profiles/	CRUD	Student Profiles (RLS Enabled)
/admissions/	CRUD	Admission Records + Carer Engine
/medical-records/	CRUD	Health & Immunization Records
/enrollments/	CRUD	Academic Year Enrollments
/undertakings/	CRUD	Legal Undertaking Declarations
2.4 /api/v1/staff/ (HR & Faculty)
Endpoint	Method	Description
/profiles/	CRUD	Staff Profiles (Dynamic Serializer Masking)
/hr-records/	CRUD	HR Details (National ID, KRA PIN)
/faculty/	GET	Teacher-Only Public List
/leave-requests/	CRUD	Leave Requests (Approve/Reject)
/leave-balances/	GET	Leave Points Remaining
2.5 /api/v1/finance/ (Billing, Payroll, Inventory)
Endpoint	Method	Description
/fee-structures/	CRUD	Fee Targets per Year/Term
/invoices/	CRUD	Student Invoices (Auto-Status)
/transactions/	CRUD	Payment Transactions (Immutable)
/purchase-requisitions/	CRUD	PR (Approve/Reject Actions)
/expenses/	CRUD	Business Expenses (Immutable)
/inventory/	CRUD	Inventory Items (Restock Alerts)
/stock-movements/	CRUD	Stock In/Out (Auto-Update)
/salary-structures/	CRUD	Staff Salary Composition
/payslips/	CRUD	Monthly Payslips (Mark Paid)
/webhooks/mpesa/validate/	POST	M-Pesa C2B Validation
/webhooks/mpesa/confirm/	POST	M-Pesa C2B Confirmation
2.6 /api/v1/transport/ (Fleet Management)
Endpoint	Method	Description
/vehicles/	CRUD	Fleet Assets
/fleet-devices/	CRUD	Tablet Hardware (UUID + PIN)
/maintenance-logs/	CRUD	Service Records
/routes/	CRUD	Transport Routes with Stops
/stops/	CRUD	Route Stops (Lat/Lng)
/daily-trips/	CRUD	Trip State Machine + start/end
/manifests/	CRUD	Trip Manifest + board/drop-off
/incidents/	CRUD	Trip Incidents
/telemetry/	CRUD	GPS History Samples
/device-login/	POST	Frictionless Hardware Login
2.7 /api/v1/lms/ (Learning Management)
Endpoint	Method	Description
/academic-years/	CRUD	Academic Years (Single Active)
/academic-terms/	CRUD	Terms within Academic Year
/event-categories/	CRUD	Calendar Color Codes
/calendar-events/	CRUD	School Events
/workspaces/	CRUD	Course Workspaces
/lesson-resources/	CRUD	E-Library Assets
/virtual-rooms/	CRUD	WebRTC Rooms + Tokens
/assignments/	CRUD	Assignments (incl. Quiz)
/submissions/	CRUD	Student Submissions + Auto-Grade
/exam-series/	CRUD	Exam Series (Mid-Term, End-Term)
/exam-components/	CRUD	Exam Papers (Max Scores)
/grade-boundaries/	CRUD	Dynamic Grade Thresholds
/exam-results/	CRUD	Student Scores + Auto-Grade
/report-cards/	CRUD	Term Report Cards
2.8 /api/v1/analytics/ (Dashboard)
Endpoint	Method	Description
/dashboard/principal/	GET	GodMode Cross-Departmental Metrics
/dashboard/summary/	GET	Dashboard Landing Page Data
/dashboard/overview/	GET	Alias to Summary
/activities/recent/	GET	Recent Payments Feed
/calendar/events/	GET	Upcoming Invoice Deadlines
---
3. JSON Payload Examples
3.1 Accounts: User Management
GET /api/v1/accounts/users/?page=1&page_size=20
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "school_id": "ADM-001",
      "email": "admin@mnara.ac.ke",
      "role": "ADMIN",
      "system_role": {
        "id": 1,
        "name": "System Administrator",
        "portal_type": "ADMIN",
        "requires_mfa": true,
        "permissions": [
          { "id": 1, "codename": "config_system", "name": "Configure System" }
        ]
      },
      "is_active": true,
      "is_staff": true,
      "requires_password_change": false,
      "status": "ACTIVE",
      "created_at": "2026-01-15T08:00:00Z",
      "updated_at": "2026-05-03T10:30:00Z"
    }
  ]
}
PATCH /api/v1/accounts/users/{id}/role/ (Flat Write)
// Request Body
{ "role": "TEACHER" }
// Response
{ "message": "Role updated to TEACHER" }
---
3.2 Students: Admission Records
GET /api/v1/students/admissions/?page=1&page_size=20
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "student": 12,
      "student_name": "Ahmed Ali",
      "student_school_id": "STU-001",
      "middle_name": "Ali",
      "other_names": "",
      "photo_url": "https://cloud.mnara.ac.ke/photos/student_12.jpg",
      "gender": "MALE",
      "nationality": "Kenyan",
      "religion": "Islam",
      "resident": "Kilimani Estate",
      "home_address": "123 Mombasa Road, Nairobi",
      "emergency_contact_email": "parent@email.com",
      "emergency_contact_phone": "+254712345678",
      "embrace_islamic": "YES",
      "mother_tongue": "English",
      "other_languages": ["Swahili", "Arabic"],
      "previous_school_nature": "REGULAR",
      "current_class": 3,
      "class_sought": 4,
      "transport_options": "TWO-WAY",
      "lunch_option": true,
      "date_of_admission": "2025-01-15",
      "regular_details": {
        "id": 1,
        "admission": 1,
        "school_name": "Nairobi Academy",
        "start_year": 2020,
        "end_year": 2024,
        "curriculum": "British National Curriculum",
        "curriculum_subjects": ["Math", "English", "Science"],
        "extracurricular_subjects": ["Music", "Art"],
        "cocurricular_activities": ["Football", "Debate"],
        "awards_received": ["Best in Math 2023"]
      },
      "carers": ["John Doe (PRIMARY)", "Jane Doe (SECONDARY)"]
    }
  ]
}
POST /api/v1/students/admissions/ (Flat Write Example)
{
  "student": 12,
  "gender": "MALE",
  "nationality": "Kenyan",
  "resident": "Kilimani Estate",
  "home_address": "123 Mombasa Road",
  "emergency_contact_email": "parent@email.com",
  "current_class": 3,
  "class_sought": 4,
  "regular_details": {
    "school_name": "Nairobi Academy",
    "start_year": 2020,
    "end_year": 2024
  },
  "carers_data": [
    { "first_name": "John", "surname": "Doe", "relationship": "PARENT", "mobile_1": "+254712345678" }
  ]
}
---
3.3 Staff: Faculty List
GET /api/v1/staff/faculty/?page=1&page_size=20
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5,
      "school_id": "TCH-001",
      "full_name": "James Mwangi",
      "surname": "Mwangi",
      "other_names": "James Otieno",
      "national_id": "12345678",
      "kra_pin": "A123456789B",
      "qualification_level": "DEGREE",
      "specialization_area": "Mathematics & Physics",
      "teacher_profile": {
        "id": 3,
        "tsc_number": "TSC/12345/2019",
        "highest_degree": "Master's in Education",
        "teaching_subjects": ["Mathematics", "Physics", "Chemistry"]
      }
    }
  ]
}
---
3.4 Finance: Invoices
GET /api/v1/finance/invoices/?page=1&page_size=20
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "student": 12,
      "student_name": "Ahmed Ali",
      "student_school_id": "STU-001",
      "fee_structure": 3,
      "fee_title": "Term 1 Tuition",
      "amount_due": "45000.00",
      "amount_paid": "30000.00",
      "status": "PARTIAL"
    }
  ]
}
POST /api/v1/finance/invoices/ (Flat Write)
{
  "student": 12,
  "fee_structure": 3,
  "amount_due": "45000.00"
}
---
4. Authentication Header
All endpoints (except auth/* and webhooks/*) require the JWT Bearer token:
Authorization: Bearer <access_token>
---
5. Change Log
Date	Version	Changes
2026-05-03	v2.0	Finalized Contract. No aliases. Strict Router enforcement.
```	 	 
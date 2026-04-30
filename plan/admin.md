# Mnara ERP: Admin Portal Integration Contract

**Target Audience:** Angular Frontend Engineering Team  
**Portal Namespace:** `admin-portal`  
**Authentication Type:** Stateless JWT (Bearer Token)  

---

## 1. Architectural Overview & Security Rules

### 1.1 The "GodMode" Authorization
When the Principal successfully authenticates and initiates the `/auth/me/` handshake, the backend returns a `permissions` array explicitly containing a single wildcard: `["*"]`. 
- **Frontend Implication:** The Angular Shell must recognize `"*"` as "GodMode" and automatically grant access to all nested routes and components within the `admin-portal`. Local RBAC checks (`ngIf="hasPermission('xyz')"`) must be bypassed.
- **Header Requirement:** Every HTTP request listed in this document MUST include the `Authorization: Bearer <access_token>` header.

### 1.2 The Immutability Protocol
Mnara ERP enforces strict immutability, particularly in the Finance Fortress. Physical deletion of critical records is permanently disabled at the database level.
- **Frontend Implication:** If your frontend attempts to fire a `DELETE` request to a financial endpoint (e.g., `/api/v1/finance/invoices/{id}/`), the backend will decisively reject it with an `HTTP 405 Method Not Allowed` or `HTTP 400 Bad Request`.
- **Action:** UIs must never offer a generic "Delete" button for ledgers or invoices. Instead, build workflows to issue "Credit Notes" or reverse transactions.

### 1.3 Pagination Standard
All list endpoints use Django REST Framework's standard LimitOffset or PageNumber pagination.
**Response Format (200 OK):**
```json
{
  "count": 1024,
  "next": "http://127.0.0.1:8000/api/v1/students/admissions/?page=3",
  "previous": "http://127.0.0.1:8000/api/v1/students/admissions/?page=1",
  "results": [ ... ]
}
```

---

## 2. The Principal's Command Center (Aggregated View)

The Admin Portal landing page must be fast. Do not dispatch parallel API calls to Academics, Staff, and Finance to build the dashboard. Instead, hit the highly optimized Analytics Aggregation Engine.

### GET `/api/v1/analytics/dashboard/summary/`

**Description:** Executes a single, deeply optimized SQL query via Django Services to return real-time health metrics of the entire institution.

**Response (200 OK):**
```json
{
  "timestamp": "2026-04-29T19:00:00Z",
  "enrollment_health": {
    "total_active_students": 1245,
    "total_capacity": 1500,
    "capacity_utilization_percent": 83.0,
    "pending_admissions": 12
  },
  "daily_attendance": {
    "date": "2026-04-29",
    "students_present_percent": 96.5,
    "staff_present_percent": 98.2,
    "absentee_count": 43
  },
  "financial_health": {
    "academic_term": "Term 2, 2026",
    "expected_revenue_kes": 45000000.00,
    "collected_revenue_kes": 32500000.00,
    "collection_rate_percent": 72.22,
    "outstanding_arrears_kes": 12500000.00,
    "pending_expense_approvals": 4
  },
  "system_alerts": [
    {
      "severity": "CRITICAL",
      "module": "FINANCE",
      "message": "M-Pesa PayBill C2B Webhook latency exceeds 2000ms."
    },
    {
      "severity": "WARNING",
      "module": "TRANSPORT",
      "message": "Bus Fleet-04 (KCA 123Z) missed Route Stop 3."
    }
  ]
}
```

---

## 3. Bounded Context APIs (The Modules)

### 3.1 Academics Module
Manages the structural blueprint of the school.

#### GET `/api/v1/academics/classrooms/`
**Description:** Fetch all classrooms with capacity thresholds and assigned form tutors.
**Response (200 OK):**
```json
{
  "count": 14,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 14,
      "name": "Year 10 - Alpha",
      "year_level_name": "Year 10",
      "room_number": "BLOCK-A-102",
      "capacity": 30,
      "current_enrollment": 28,
      "class_teacher": {
        "school_id": "STF-088",
        "full_name": "Jane Doe"
      },
      "is_active": true
    }
  ]
}
```

#### POST `/api/v1/academics/students/bulk-promote/`
**Description:** End-of-year academic rollover mechanism.
**Request:**
```json
{
  "source_year_level": 9,
  "target_year_level": 10,
  "academic_year": "2026/2027",
  "student_ids": [101, 102, 103]
}
```

### 3.2 Staff & HR Module
Manages pedagogical faculty and support staff statutory details.

#### GET `/api/v1/staff/faculty/`
**Description:** Retrieve the list of active teaching staff and their HR records.
**Response (200 OK):**
```json
{
  "count": 42,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 42,
      "staff_profile": {
        "school_id": "STF-088",
        "email": "j.doe@mnara.ac.ke",
        "is_active": true,
        "totp_enrolled_at": "2026-01-15T08:30:00Z"
      },
      "surname": "Doe",
      "other_names": "Jane Mary",
      "national_id": "23456789",
      "kra_pin": "A123456789Z",
      "nssf_number": "NS-999222",
      "teacher_data": {
        "tsc_number": "TSC-555666",
        "specialization_area": "Mathematics & Physics"
      }
    }
  ]
}
```

### 3.3 Students & Admissions Module
Manages the complete K-12 lifecycle, health records, and demographics.

#### POST `/api/v1/students/admissions/`
**Description:** Admit a new student. 
**Parent Resolution Engine:** When submitting carers, include their `email` and `mobile_1`. The backend will automatically search for existing parents. If found (sibling check), it links the student to the existing parent. If not, it auto-generates a unique `PAR-xxxx` ID, creates the Parent account, and sets their temporary password to the child's `first_name` in lowercase.
**Request Payload Snippet:**
```json
{
  "admission_number": "ADM-2026-046",
  "student": { "first_name": "Liam", "last_name": "Kipkemboi" },
  "carers_data": [
    {
      "carer_level": "PRIMARY",
      "relationship": "PARENT",
      "first_name": "Jane",
      "surname": "Kipkemboi",
      "email": "jane@example.com",
      "mobile_1": "0700000000"
    }
  ]
}
```

#### GET `/api/v1/students/admissions/`
**Description:** View current and archived admission records.
**Response (200 OK):**
```json
{
  "count": 890,
  "next": "http://127.0.0.1:8000/api/v1/students/admissions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 890,
      "admission_number": "ADM-2026-045",
      "student": {
        "school_id": "STU-1245",
        "first_name": "Liam",
        "last_name": "Kipkemboi"
      },
      "current_class": "Year 7 - Blue",
      "date_of_admission": "2026-01-05",
      "is_active": true
    }
  ]
}
```

#### GET `/api/v1/students/medical-records/{student_id}/`
**Description:** Retrieve highly sensitive medical data (requires GodMode or School Nurse clearance).
**Response (200 OK):**
```json
{
  "blood_group": "O-",
  "allergies": ["Penicillin", "Peanuts"],
  "chronic_conditions": ["Asthma"],
  "emergency_contact": "+254700000000",
  "doctor_name": "Dr. Sarah Wanjiku",
  "hospital_preference": "Aga Khan University Hospital"
}
```

### 3.4 Finance Fortress
Manages billing, expenses, and strictly immutable ledgers.

#### GET `/api/v1/finance/fee-balances/`
**Description:** Retrieve aggregated fee arrears per student.
**Response (200 OK):**
```json
{
  "count": 312,
  "next": "...",
  "previous": null,
  "results": [
    {
      "student_id": "STU-1245",
      "student_name": "Liam Kipkemboi",
      "year_level": "Year 7",
      "total_invoiced": 150000.00,
      "total_paid": 100000.00,
      "current_balance": 50000.00,
      "status": "ARREARS"
    }
  ]
}
```

#### POST `/api/v1/finance/payments/manual/`
**Description:** Principal/Bursar workflow to manually log a bank transfer or physical cheque.
**Request:**
```json
{
  "student_id": "STU-1245",
  "amount": 50000.00,
  "payment_method": "BANK_TRANSFER",
  "reference_number": "KCB-TXN-987654321",
  "date_received": "2026-04-29"
}
```

#### PATCH `/api/v1/finance/expenses/{id}/approve/`
**Description:** Principal's workflow to approve pending departmental purchase requisitions.
**Request:**
```json
{
  "status": "APPROVED",
  "approval_notes": "Approved for Science Dept equipment."
}
```

### 3.5 Transport & Fleet Telemetry (WebSockets)
Mnara ERP handles real-time fleet tracking via Django Channels (WebSockets). The Admin Portal includes a live map view.

#### WebSocket `ws://127.0.0.1:8000/ws/fleet/live/`
**Description:** Connect to the live fleet telemetry socket. Requires token authentication upon connection.
**Incoming Message (From Server):**
```json
{
  "type": "telemetry_update",
  "fleet_id": "FLT-04",
  "license_plate": "KCA 123Z",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "speed_kmh": 45,
  "status": "IN_TRANSIT"
}
```

### 3.6 System & Access Management (RBAC)
As the "GodMode" Admin, the Principal or IT Director manages the system's users, resets passwords, and assigns security roles.

#### POST `/api/v1/accounts/users/`
**Description:** Create a new user account (Staff, Admin, Finance).
**Note on Passwords:** Do not submit a password field. The backend will automatically generate the account and set the temporary password to the user's `first_name` in lowercase.
**Request:**
```json
{
  "email": "j.smith@mnara.ac.ke",
  "first_name": "John",
  "last_name": "Smith",
  "role": "TEACHER",
  "school_id": "STF-099",
  "is_active": true
}
```

#### PATCH `/api/v1/accounts/users/{user_id}/role/`
**Description:** Escalate or modify a user's system role (e.g., promoting a Teacher to Finance).
**Request:**
```json
{
  "role": "FINANCE",
  "reason": "Promoted to Bursar's Office"
}
```

#### POST `/api/v1/accounts/users/{user_id}/revoke-access/`
**Description:** Emergency action to instantly kill all active sessions and block login for a compromised or terminated employee.
**Request:**
```json
{
  "action": "REVOKE_AND_BLACKLIST",
  "notes": "Employee terminated on 2026-04-29"
}
```

---

## 4. Error Handling & Constraints

### 4.1 Form Validation Errors (HTTP 400)
When a frontend form submission fails backend validation, Django REST Framework returns a structured `HTTP 400 Bad Request` mapping errors directly to the payload keys. 
- **Frontend Implication:** You must parse this JSON to display inline field errors beneath the respective Angular Material inputs.

**Example Response for a failed Staff creation:**
```json
{
  "email": [
    "A user with this email already exists."
  ],
  "teacher_data": {
    "tsc_number": [
      "This field is required for teaching staff."
    ]
  },
  "non_field_errors": [
    "The provided KRA PIN does not match the statutory format."
  ]
}
```

### 4.2 Handling Soft-Deletes (`is_active: false`)
Physical deletions are prohibited across the majority of Mnara ERP models to preserve historical and referential integrity (e.g., a teacher who resigned must remain in the database for past Report Cards).
- **Frontend Implication:** Instead of deleting a record, the frontend should issue a `PATCH` request setting `is_active: false`.
- **UI Rendering:** Do not completely hide soft-deleted records in the Admin Portal. Render them with an "Archived" badge or place them in a separate "Inactive" tab so the Principal retains historical visibility.

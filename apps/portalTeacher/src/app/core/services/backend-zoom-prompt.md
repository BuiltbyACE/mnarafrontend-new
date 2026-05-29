# Zoom Integration — Backend Changes Required

## Overview

Replace Jitsi with Zoom for live classes. The frontend now expects Zoom meeting data from two endpoints instead of Jitsi room config.

---

## 1. Zoom API Credentials (Django Settings)

Add to `settings.py`:

```python
ZOOM_ACCOUNT_ID = os.getenv('ZOOM_ACCOUNT_ID')
ZOOM_CLIENT_ID = os.getenv('ZOOM_CLIENT_ID')
ZOOM_CLIENT_SECRET = os.getenv('ZOOM_CLIENT_SECRET')
```

## 2. Zoom Service (new file: `services/zoom.py`)

Create a service that:

1. **Gets access token** — calls `POST https://zoom.us/oauth/token` with `grant_type=account_credentials` using `account_id`, `client_id`, `client_secret`
2. **Creates meeting** — calls `POST /v2/users/me/meetings` with:
   ```json
   {
     "topic": "{room.title}",
     "type": 2,
     "start_time": "{now}",
     "duration": 60,
     "timezone": "Africa/Nairobi",
     "settings": {
       "host_video": true,
       "participant_video": true,
       "join_before_host": true,
       "mute_upon_entry": true,
       "waiting_room": false,
       "approval_type": 2
     }
   }
   ```
   Returns: `{ join_url, start_url, id (meeting_id), password, ... }`

3. **End meeting** (optional) — calls `PATCH /v2/meetings/{meetingId}/status` with `{"action": "end"}`

---

## 3. Endpoint Changes

### `POST /lms/teacher/live-classes/{roomId}/start/`

**Current return (Jitsi):**
```json
{
  "domain": "meet.ffmuc.net",
  "room_name": "mnara-3f8a21bc",
  "display_name": "Mr. Kamau",
  "is_moderator": true,
  "room_title": "Math 101",
  "subject": "Mathematics",
  "classroom": "Form 3A",
  "status": "LIVE"
}
```

**New return (Zoom):**
```json
{
  "join_url": "https://zoom.us/j/1234567890",
  "start_url": "https://zoom.us/s/1234567890?zak=xxx",
  "meeting_id": "1234567890",
  "password": "abc123",
  "room_title": "Math 101",
  "subject": "Mathematics",
  "classroom": "Form 3A",
  "status": "LIVE"
}
```

| Field | Purpose |
|---|---|
| `join_url` | URL students use to join (no account needed) |
| `start_url` | URL for the teacher to launch/host the meeting |
| `meeting_id` | Numeric meeting ID for manual entry in Zoom app |
| `password` | Meeting password |

**Logic:**
- Create a Zoom meeting via Zoom API
- Update the VirtualClassroom/ScheduledClass record with the `meeting_id` and `join_url`
- Return the Zoom config

### `POST /lms/live-classes/{roomId}/join/` (student)

**Current return (Jitsi):**
```json
{
  "domain": "meet.ffmuc.net",
  "room_name": "mnara-3f8a21bc",
  "display_name": "Student Name",
  "is_moderator": false,
  "token": "...",
  "room_title": "Math 101",
  "teacher": "Mr. Kamau",
  "subject": "Mathematics"
}
```

**New return (Zoom):**
```json
{
  "join_url": "https://zoom.us/j/1234567890",
  "meeting_id": "1234567890",
  "password": "abc123",
  "room_title": "Math 101",
  "teacher": "Mr. Kamau",
  "subject": "Mathematics"
}
```

**Logic:**
- Retrieve the stored `meeting_id` and `join_url` from the room/class record (created by the teacher's start action)
- Return to the student

---

## 4. Model Changes

The model that stores live class data (likely `VirtualClassroom` or similar) needs fields:

```python
meeting_id = models.CharField(max_length=20, blank=True, null=True)  # Zoom meeting ID
join_url = models.URLField(max_length=500, blank=True, null=True)     # Zoom join link
meeting_password = models.CharField(max_length=20, blank=True, null=True)
```

Or create a related `ZoomMeeting` model if you prefer separation.

---

## 5. Data Flow Summary

```
Teacher clicks "Start Class"
  → POST /lms/teacher/live-classes/{id}/start/
  → Backend: Zoom API create_meeting(topic=room.title, duration=60)
  → Zoom returns { join_url, start_url, id, password }
  → Backend stores meeting_id + join_url on room record
  → Backend returns Zoom config to frontend
  → Frontend shows meeting details + "Launch Zoom" button

Student clicks "Join Class"
  → POST /lms/live-classes/{id}/join/
  → Backend retrieves stored meeting_id + join_url
  → Backend returns Zoom config to frontend
  → Frontend shows "Open Zoom" button

Teacher clicks "End Class"
  → POST /lms/teacher/live-classes/{id}/end/
  → (Optional) Zoom API end_meeting(meetingId)
  → Backend sets room status = ENDED
```

---

## 6. Environment Variables to Add

```
ZOOM_ACCOUNT_ID=<your_account_id>
ZOOM_CLIENT_ID=<your_client_id>
ZOOM_CLIENT_SECRET=<your_client_secret>
```

These come from creating a **Server-to-Server OAuth app** in the Zoom Marketplace (free).

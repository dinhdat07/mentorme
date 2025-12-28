# Phase 2 – Scheduling & Sessions (Prep Only)

This document outlines the intended design for scheduling/sessions before implementation. No code has been added yet.

## Data Model (planned)
- `TutorAvailability`: day_of_week, start_minute, end_minute, timezone, locationType.
- `TutorUnavailability` (new): date/time ranges to block off-time.
- `ClassSchedule`: belongs to Class; recurrence rule (weekly slots) or ad-hoc sessions list; timezone; total_sessions.
- `Session`: belongs to Class; scheduled_start/end (UTC), status (SCHEDULED/IN_PROGRESS/COMPLETED/MISSED/CANCELLED), flags for tutor/student start/complete confirmations, dispute_flagged_at.

## Proposed Endpoints (names only)
- Tutor:
  - `GET /api/tutors/me/availability` / `PUT /api/tutors/me/availability`
  - `GET /api/tutors/me/unavailability` / `PUT /api/tutors/me/unavailability`
- Class scheduling:
  - `POST /api/classes/:id/schedule` (create recurring or explicit sessions)
  - `GET /api/classes/:id/schedule` (view schedule + generated sessions)
- Session lifecycle:
  - `PATCH /api/sessions/:id/start` (tutor/student confirm start)
  - `PATCH /api/sessions/:id/complete` (tutor/student confirm completion)
  - `PATCH /api/sessions/:id/cancel`
- Calendars:
  - `GET /api/calendar/tutor` / `GET /api/calendar/student` (upcoming sessions merged)

## Conflict Rules (to enforce)
- Tutor cannot schedule/accept sessions overlapping:
  - other ACTIVE/CONFIRMED sessions
  - tutor unavailability blocks
- Student cannot schedule overlapping sessions across their ACTIVE classes.
- Timezone-aware comparison (store UTC, keep user timezone for display).

## Integration Points
- Booking → once accepted, require schedule creation before class becomes ACTIVE.
- Class status progression uses session completion counts.
- Notifications/reminders to be wired via existing or new job runner (outside Phase 1.5 scope).

## Open Questions
- Whether verified tutors can edit availability while PENDING suspension.
- Payment/escrow hooks on session confirmation (if needed later).

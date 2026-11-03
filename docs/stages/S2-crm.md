# Stage 2: CRM and schedule

Result: an admin registers athletes and guardians, assigns groups, and sees a schedule of sessions.

## 2.1 Athletes and guardians (reference module)
This module is the pattern all later CRUD copies, so keep it clean.

Tables:
- `athletes` id, club_id, full_name, birth_date, phone, primary_branch_id, status (trial, active, paused, archived), joined_at, note
- `guardians` id, club_id, full_name, phone, telegram_chat_id, consent_at, invite_token_hash; unique (club_id, phone)
- `athlete_guardians` athlete_id, guardian_id, club_id, relation (mother, father, self, other), is_primary
- `athlete_status_history` athlete_id, club_id, from, to, reason, actor_id, at

Rules:
- Guardian is optional for adults. For an adult with no guardian, create a guardian row from the athlete with `relation=self`, so the bot works the same way.
- Under-18 athletes need at least one guardian. Exactly one primary per athlete.
- One guardian may have many athletes; one athlete may have many guardians.
- Collect only the listed fields. No medical data.

`ScopeService` (used by all later modules):
- owner: whole club.
- admin: athletes whose primary branch is in scope, or with an active enrollment in an in-scope group.
- coach: athletes with an active enrollment in the coach's groups.

UI: list with search and filters for branch, status and age; create and edit; profile with tabs Info, Guardians, History, and empty tabs Subscriptions, Payments, Attendance.

Accept: one guardian linked to two athletes; admin of another branch gets 404; adult can be created without a guardian and gets a self row; filter and scope tests pass.

## 2.2 Groups, coaches, schedule
Tables:
- `coaches` id, club_id, user_id nullable, full_name, phone, employment, active
- `groups` id, club_id, branch_id, sport_id, coach_id, name, capacity, age_min, age_max, active
- `group_enrollments` id, club_id, group_id, athlete_id, started_on, ended_on, status (active, paused, ended), reason; partial unique (group_id, athlete_id) where active
- `schedules` id, club_id, group_id, weekday, start_time, end_time, room, valid_from, valid_to
- `sessions` id, club_id, group_id, schedule_id nullable, coach_id, session_date, start_time, end_time, room, status (planned, held, cancelled, moved), moved_to_id; index (group_id, session_date); unique (schedule_id, session_date)
- `holidays` id, club_id, date, name

Behavior:
- Enroll, transfer (ends the old row, starts a new one, keeps history), pause, resume, archive. Capacity uses `capacityPolicy`.
- `generateSessions(clubId, from, to)` is idempotent, skips holidays, snapshots the group's coach into `sessions.coach_id`.
- Session actions: cancel, move, change coach (substitute). Cancel and move call `enqueueNotification` with type `session_changed`, one per primary guardian.

UI: groups list; group card with athletes, coach and schedule; weekly calendar; daily sessions; coach profile.
API: extend the athlete filters with sport, coach and group.

Accept: transfer preserves history; re-running generation creates no duplicates; a holiday gets no session; a coach sees only their groups; a substitute appears on that session only.

## 2.3 Import, demo data, stage demo
- Excel import (`.xlsx`) for athletes, guardians, group, opening debt. Flow: upload, validate, preview with row errors, confirm in one transaction, download error rows. Keep opening debt in `import_opening_debts` (club_id, athlete_id, amount, as_of); step 3.2 converts it into charges.
- `pnpm db:seed`: pilot demo with 2 branches, 3 coaches, 4 groups, 20 athletes, realistic guardians and a shared parent.

Accept: importing the same valid file twice does not duplicate people (match by guardian phone + athlete name + birth date); a bad row blocks nothing until confirm and is reported clearly; owner demo works end to end.

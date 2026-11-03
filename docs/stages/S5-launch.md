# Stage 5: Bot and launch

Result: parents get messages and self-service in Telegram; the product passes acceptance and runs on staging.

## 5.1 Jobs and notification delivery
BullMQ in `worker.ts`:
- Outbox dispatcher: picks due `pending` rows with `FOR UPDATE SKIP LOCKED`, sends, retries 5 times with backoff, then `failed` with `last_error`. Delivery never changes business tables.
- Hourly scanner with `withSystem`: for each club where local hour = `notifyHour`, enqueue:
  - due soon: `reminderBeforeDays` before due; dedupe `charge:<id>:before`.
  - overdue: each `overdueDays` value; dedupe `charge:<id>:overdue:<n>`.
- Daily per club, at local 00:30:
  - expire subscriptions past their end.
  - create next periods only when settings and `auto_renew` allow.
  - generate sessions for the next 14 days.
  - resume finished freezes.
- All jobs are idempotent and each club is isolated, so one club's failure does not stop others.
- Quiet hours: reminder and change messages due between `quietStart` and `quietEnd` wait until the end of quiet hours.

Templates: code-defined `uz` and `ru`, with owner-editable text in `notification_templates` (club_id, type, lang, body), validated placeholders. Types: payment_due_soon, payment_overdue, payment_received, attendance_marked, session_changed.

UI (Communication): bot link, templates, message log with status and error, guardians not connected with copyable invite link.

Accept: tests run with a fake clock and fake sender: rerun sends no duplicates; sender failure leaves the payment intact and retries; a guardian with no consent becomes `skipped`; job timing respects club timezone.

## 5.2 Telegram bot
grammY, webhook in production and polling in dev. One bot for all clubs.

Linking:
1. Parent opens the bot, optionally through an invite deep link.
2. Bot shows the consent text and a "Share contact" button.
3. Verify `contact.user_id === from.id`; otherwise refuse.
4. Match the normalized phone against guardians through a narrow `SECURITY DEFINER` lookup returning only guardian and club ids. An invite token is one-time and must match the phone.
5. Store `telegram_chat_id` and `consent_at`. No match: tell them to contact the club, with no data disclosed.

Menu in the guardian's language: My children, Subscription, Payments, Attendance, Schedule, Contact club. A club switcher appears for a guardian in several clubs. Every read uses `withTenant` and is limited to linked athletes.

`/stop` revokes consent. Telegram 403 (bot blocked) marks the chat undeliverable and stops sending until the parent returns. Handle Telegram rate limits. Verify the webhook secret token.

Accept: parent with 2 children sees both separately; a forwarded foreign contact is refused; one parent cannot get another family's data through callback data tampering (test); no message goes before consent; an adult athlete with `relation=self` works.

## 5.3 Hardening, acceptance, staging
Create `tests/acceptance/` with one named test per criterion:
1. Club A user cannot read club B athletes or finance.
2. Parent sees 2 children's separate subscriptions and attendance.
3. Calendar, 30-day and 12-session plans calculate correctly.
4. 400000 charge and 150000 payment leave 250000 debt.
5. Repeated cash request creates one payment.
6. Coach marks own group only; admin stays in own branch.
7. No second attendance row for one athlete and session.
8. Notification failure does not undo a financial transaction.
9. Reversal recalculates debt and the cash report.
10. Branch sums match club totals, excluding club-wide expenses.

Playwright, critical paths only: register + subscribe + pay + receipt; coach marks attendance on mobile viewport; admin closes cash day.

Operations:
- `compose.prod.yml` with Caddy TLS, API, worker, web, Postgres, Redis; staging `.env.example`.
- Daily encrypted `pg_dump` to S3 storage; `scripts/restore-test.sh` restores to a temporary DB and checks row counts.
- Security pass: dependency audit, rate limits, security headers, CORS, file upload type and size limits, phone masking test, RLS present on every table with `club_id` (automated test reading the catalog).
- `docs/RUNBOOK.md`, max 1 page: deploy, rollback, backup restore, create a club, reset a password.
- Include a pilot settings checklist listing each default from `club_settings`, to confirm with the club before go-live.

Accept: all 10 tests and Playwright paths pass in CI; restore script passes; clean deploy from an empty server works by following the runbook.

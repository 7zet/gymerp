# Stage 1: Foundation

Result: an owner logs in, manages branches, sports and staff. Tenant isolation is proven by tests.

## 1.1 Monorepo and tooling
Build the layout from CLAUDE.md using current stable versions.
- Compose: Postgres, test Postgres, Redis, MinIO. `.env.example` lists every variable.
- ESLint, Prettier, strict TS. Root scripts from CLAUDE.md work.
- API `/health` checks DB and Redis. Web has one blank page. `apps/api` has separate `main.ts` and `worker.ts` entrypoints.
- GitHub Actions: lint, typecheck, test on push.

Accept: fresh clone + `docker compose up -d` + `pnpm dev` gives a healthy API; CI config runs locally without errors.

## 1.2 Database core and tenant isolation
Tables:
- `clubs` id, name, status (active, read_only, suspended), timezone, paid_until, saas_plan_id
- `saas_plans` id, name, price, limits jsonb (global)
- `branches` id, club_id, code, name, address, phone, active
- `users` id, phone unique, password_hash, full_name, must_change_password, is_platform_admin (global)
- `memberships` id, user_id, club_id, role (owner, admin, coach), status
- `membership_branches` membership_id, branch_id, club_id
- `sports` id, club_id, name, active
- `club_settings` club_id PK, data jsonb
- `audit_logs` id, club_id, actor_id, action, entity, entity_id, before, after, reason, created_at
- `notification_outbox` id, club_id, type, guardian_id, payload jsonb, dedupe_key, status (pending, sent, failed, skipped), attempts, next_attempt_at, last_error; unique (club_id, dedupe_key)

Roles and isolation:
- Migrations run as owner. App connects as non-superuser `app_user`, with RLS enabled and forced on all tenant tables.
- Policy: `club_id = current_setting('app.club_id')::uuid`.
- `withTenant(clubId, fn)` opens a transaction, runs `SET LOCAL app.club_id`, stores the tx in AsyncLocalStorage.
- Role `app_system` with explicit BYPASSRLS, used only by jobs and platform endpoints through `withSystem(fn)`.
- Append-only trigger helper; apply it to `audit_logs`.
- Helpers: `audit(...)`, `enqueueNotification(...)`.

`club_settings` zod schema in shared, with these defaults:
`prorate:true, roundingStep:1000, absentConsumes:true, excusedConsumes:false, packageValidityDays:45, freezeMaxCount:1, freezeMinDays:7, freezeMaxDays:30, autoRenewCalendar:true, autoRenewOther:false, trialFreeSessions:1, debtorAccess:"warn", capacityPolicy:"warn", adminDiscountMaxPct:10, calendarDueDays:5, coachEditHours:24, notifyAttendance:"absent_only", reminderBeforeDays:3, overdueDays:[1,3,7], notifyHour:10, quietStart:21, quietEnd:9`

Accept: integration test proves that with club A set, `app_user` cannot select, update or insert club B rows; without a set club it gets zero rows; UPDATE or DELETE on `audit_logs` fails.

## 1.3 Auth and RBAC
- `POST /auth/login` phone + password; argon2id; login rate limit. Access JWT 15 min, rotating refresh token in httpOnly cookie, stored hashed.
- Token holds user and active membership. `POST /auth/switch-club` for users in multiple clubs.
- Owner or admin reset creates a one-time password and sets `must_change_password`. No SMS.
- Guards in order: auth, tenant (derives club from membership and opens `withTenant`), club status (`read_only` allows only GET), roles.
- Platform guard for `/platform/*`. Platform endpoints return aggregates only, never athlete, guardian or finance rows.
- Normalize phones to E.164. Add log redaction for phone, token, password.

Accept: table-driven tests cover every role against a sample endpoint, wrong tenant returns 404, expired token returns 401, read-only club cannot write.

## 1.4 Web shell and club administration
Read `docs/CONVENTIONS.md`. Build:
- Login, forced password change, club switcher, role-aware sidebar with the sections: Dashboard, Athletes, Groups, Subscriptions, Finance, Attendance, Coaches, Communication, Reports, Settings. Unbuilt sections show a placeholder.
- next-intl with `uz` default and `ru` scaffold. Shared components from CONVENTIONS.
- CRUD: branches, sports, staff (invite creates user + membership + branch scope), club settings form generated from the zod schema.
- Platform area: clubs list and create (with first owner), SaaS plans, paid_until, activity counts.
- SaaS expiry: from `paid_until` the UI shows a warning banner; once `paid_until + 14 days` has passed, the status guard treats the club as read-only.

Accept: demo user logs in as owner, creates a branch and an admin; that admin sees only their branch scope; platform admin cannot open club data.

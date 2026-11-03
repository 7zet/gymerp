# Stage 4: Operations

Result: coaches mark attendance by phone, payroll and expenses are calculated, the owner sees true numbers.

## 4.1 Attendance and coach PWA
Tables:
- `attendance` id, club_id, session_id, athlete_id, status (present, absent, excused), marked_by, marked_at, over_limit bool; unique (session_id, athlete_id)
- `attendance_history` attendance_id, club_id, from, to, actor_id, at

Rules:
- Bulk upsert endpoint for one session. Coach only for own sessions and within `coachEditHours`; later only admin or owner.
- In the same transaction: recalc `used_sessions` of the athlete's active session-limited subscription (sessions, single, trial) for that group with `billing-core`, so a changed status restores or consumes correctly.
- Over limit or expired: never block; set `over_limit`, show in the admin review list.
- Debt: coach sees only a debtor flag, never amounts, and only when `debtorAccess` is `warn`. With `block`, the UI shows the block label; the admin may override.
- Marking moves the session to `held`. Enqueue `attendance_marked` per `notifyAttendance`, dedupe by attendance id + status.

UI:
- Coach PWA: today's sessions, one-tap attendance with large targets, "all present" then adjust, offline-tolerant queue using local draft and retry. Installable manifest.
- Admin: daily sessions, attendance sheet, stats by athlete and group.

Accept: duplicate attendance is impossible at DB level; changing absent to excused returns the session with defaults; coach cannot mark another group's session (404) or edit after 24h; usable at 360px.

## 4.2 Expenses and payroll
Tables:
- `expense_categories` id, club_id, name, system_key; seed rent, utilities, salary, equipment, marketing, repairs, other. `salary` cannot be chosen by hand.
- `expenses` id, club_id, branch_id nullable, category_id, amount, incurred_on, note, file_key, source (cashbox, owner), created_by, reversal_of
- `compensation_rules` id, club_id, coach_id, branch_id, type (fixed, percent, per_session), value, valid_from, valid_to
- `payroll_periods` id, club_id, branch_id, month, status (open, closed)
- `payroll_items` id, club_id, period_id, coach_id, rule_id, accrued, bonus, deduction, paid
- `payroll_lines` item_id, club_id, source_type, source_id, amount (calculation trail)
- `payroll_adjustments` id, club_id, item_id, amount, reason, actor_id

Expense rules:
- `source=cashbox` requires a branch and writes `expense_out`. `branch_id` null means club-wide, excluded from branch reports, included in club total.
- Corrections use a reversing row. File upload goes to S3 storage, private, signed URL.

Payroll rules, one rule set per coach per branch (put formulas in `billing-core`, with tests):
- fixed: amount for the period.
- percent: value% of allocated cash in the month for charges of groups in that branch whose coach at allocation time was this coach. Reversals subtract. A reversal after the source period closes lands as a negative line in the current open period.
- per_session: count of `held` sessions where `sessions.coach_id` is this coach, times rate. Substitutes get paid here; percent stays with the group's coach.
- Recalculate an open period idempotently. Closing freezes it; later changes only through `payroll_adjustments`.
- Payout: `payroll_out` cash movement and one auto expense in category `salary`, so salary is counted exactly once.

UI: expenses; coach rules; period screen with accrued, bonus, deduction, paid, balance and a drilldown to lines.

Accept: tested examples for all 3 models and a substitute; coach in 2 branches has 2 items; closed period refuses change; reversal after close appears as negative next period; salary expense counted once in reports; cash close includes expense and payroll.

## 4.3 Reports and dashboard
Keep separate, never merged:
- Cash received (from movements).
- Accrued sales (charges net of voids and approved discounts).
- Debt (from balances).
- Expenses.
- Result, two labeled views: cash result (cash in - expenses) and accrual result (accrued - expenses).

Slices: period, branch, sport, coach. Club-wide expenses appear on a separate line; allocation across branches is out of scope.

Reports: attendance, revenue, debt with aging, expenses, branches. CSV export. Owner dashboard: today's cash, active athletes, expiring in 7 days, debtors and total debt, attendance rate, per-branch table. Admin dashboard is limited to scope. Coach has no finance. Use SQL aggregates with existing indexes; no caching unless tests show a problem.

Accept: on seeded data, the sum of branch figures equals the club figure excluding the club-wide line; cash report matches `cash_movements`; a test proves cash and accrual differ when a charge is unpaid; coach gets 403 on all reports.

# Stage 3: Billing and cash

Result: three plan types work, cash is taken, debts are correct, reversals and cash closing are safe.

Balance formula: `balance = charges - confirmed payments (net of reversals) - confirmed adjustments`. Positive means debt, negative means advance.

## 3.1 billing-core engine
Pure TypeScript in `packages/billing-core`: no DB, no NestJS, no `Date.now()`. Dates are ISO strings. Money is integer. All ends are inclusive. Write the tests first.

Functions:
- `periodFor(plan, start, settings)`:
  - calendar: from start to last day of that month; amount = `ceilTo(price * days / daysInMonth, roundingStep)` when `prorate` and start is not day 1, else full price.
  - days30: end = start + 29 days, full price.
  - sessions: end = start + `packageValidityDays - 1`, full price, limit from plan.
  - single: end = start, full price, limit 1.
  - trial: end = start + `packageValidityDays - 1`, amount 0, limit `trialFreeSessions`.
- `applyFreeze(sub, from, days, settings)`: enforces count and day limits; end moves by `days` for all models.
- `nextPeriod(sub, plan, settings)`: starts the day after end. Calendar returns to month end with proration.
- `consumeSession(status, settings)`: present always; absent per `absentConsumes`; excused per `excusedConsumes`.
- `recalcUsage(attendanceRows, settings)`.
- `allocate(paymentAmount, openCharges)`: oldest due first; returns allocations and advance remainder.
- `balance(charges, payments, adjustments)`.
- `refundSuggestion(sub, paid, onDate)`: time plans use unused days ratio; sessions use unused sessions ratio; rounded down to `roundingStep`.
- `discount(price, value, kind)` and `requiresOwnerApproval(pct, settings)`.

Required cases (price 400000, roundingStep 1000):
| Case | Expected |
|---|---|
| Calendar start 2026-11-01 | 400000, end 2026-11-30 |
| Calendar start 2026-11-16 | 200000 |
| Calendar start 2026-11-17 | 187000 |
| Calendar in 2026-11, frozen 10 days | end 2026-12-10 |
| Next period after that | 2026-12-11 to 2026-12-31, 271000 |
| days30 start 2026-11-03 | end 2026-12-02 |
| Sessions start 2026-11-03, validity 45 | end 2026-12-17 |
| Charge 400000, payment 150000 | balance 250000 |
| Payment 500000, charge 400000 | balance -100000 |
| 12 sessions: 1 present, 1 absent, 1 excused, defaults | used 2, left 10 |
| Same with `absentConsumes:false` | used 1, left 11 |
| Second freeze with `freezeMaxCount:1` | rejected |

Also property tests: allocations never exceed the payment or a charge's remainder, and allocated + advance always equals the payment.

Accept: all cases pass, 100% branch coverage of this package.

## 3.2 Plans, subscriptions, charges
Tables:
- `plans` id, club_id, sport_id, billing_type (calendar, days30, sessions, single, trial), price, session_limit, active; `plan_branches`
- `subscriptions` id, club_id, athlete_id, plan_id, group_id, start_on, end_on, price, session_limit, used_sessions, freeze_count, status (draft, active, frozen, expired, cancelled), auto_renew
- `subscription_freezes` subscription_id, club_id, from_on, days, reason, actor_id
- `charges` id, club_id, branch_id, athlete_id, subscription_id, period_start, period_end, due_date, amount, status (open, void), reason; index (club_id, due_date)
- `adjustments` id, club_id, athlete_id, charge_id nullable, amount, kind (discount, correction, opening), reason, status (pending, approved, rejected), requested_by, approved_by

Rules:
- Activating creates one charge. Due date: calendar auto-renewal is start + `calendarDueDays`; everything else is start date.
- A trial plan creates no charge and uses `trialFreeSessions`. A single or individual session is a plan with limit 1.
- An athlete may hold independent subscriptions for different sports.
- Discount above `adminDiscountMaxPct` stays pending until the owner approves; pending does not affect balance.
- Group transfer keeps the subscription; set the new `group_id`; a price difference applies only from the next period.
- Cancel: stores `refundSuggestion`, voids the unpaid remainder via adjustment; real refund needs owner approval in 3.4. Never delete charges.
- Audit: activate, freeze, extend, discount, cancel.
- Convert `import_opening_debts` into opening charges with idempotent conversion.

UI: plans; subscription wizard from the athlete profile; lists for expiring, frozen, expired; freeze, extend and cancel dialogs that show the resulting dates and amounts before confirm.

Accept: all three models produce correct charges through the API; second freeze rejected; pending discount does not change balance; admin outside the branch is refused.

## 3.3 Payments, reversals, balance
Tables (`payments`, `payment_allocations`, `cash_movements` are append-only):
- `payment_receipts` id, club_id, branch_id, receipt_no, idempotency_key, received_by, paid_at, total, note; unique (club_id, idempotency_key), unique (club_id, receipt_no)
- `receipt_counters` club_id, branch_id, year, last
- `payments` id, club_id, receipt_id, athlete_id, amount, method fixed to CASH, reversal_of nullable, reason
- `payment_allocations` id, club_id, payment_id, charge_id, amount, allocated_at
- `cash_movements` id, club_id, branch_id, type (payment_in, reversal_out, refund_out, expense_out, payroll_out, owner_withdrawal, correction), amount signed, ref_type, ref_id, actor_id, business_date, created_at

`POST /payments` requires an `Idempotency-Key` header and has `lines[]` per athlete, in one transaction:
1. Replay of a key returns the original receipt. Same key with a different body returns 409.
2. Number from locked counter: `B01-2026-000123`.
3. Rows for payment, allocations via `billing-core`, cash movement.
4. Any new charge automatically absorbs an existing advance, oldest first.
5. `enqueueNotification('payment_received', dedupe = payment id)` for primary guardians.
6. Audit.

Reversal `POST /payments/:id/reverse`, reason required:
- Admin: own branch and day still open. Owner: any time.
- Adds a negative payment, negative allocations and a `reversal_out` movement dated today. The original stays unchanged. Double reversal rejected.

Balance is calculated from rows. Add a SQL view `athlete_balances` and use it in lists.

Accept: 400000 charge and 150000 payment give debt 250000; 20 concurrent identical requests create one receipt; concurrent different payments get unique sequential numbers; reversal restores debt and the cash report; one receipt can pay two children; UPDATE on payments fails.

## 3.4 Cashbox and finance screens
Table `cash_closings` id, club_id, branch_id, business_date, expected, counted, difference, closed_by, confirmed_by, note, status (closed, confirmed); unique (branch_id, business_date).

- Expected = sum of all `cash_movements` for the branch through that date.
- Admin counts and closes; owner confirms; difference is stored and never auto-fixed.
- After close, writes dated to that day are refused; corrections carry today's date.
- Owner withdrawal: `owner_withdrawal` movement, owner role only. Refund: owner approves amount, creates `refund_out`.
- Daily report per cashier and branch: in, reversals, refunds, expenses, payroll, withdrawals, opening, closing. CSV export.

UI: new payment (with choice of children for a shared parent, live allocation preview, printable receipt, stable idempotency key per form); debtors; due soon, overdue and paid lists; cash day; closing dialog; finance tabs on the athlete profile. Debtor filter in the athlete list.

Accept: double-clicking submit creates one payment; closing shows correct expected cash in a scenario with payment, reversal and withdrawal; closed day refuses backdated reversal while today's correction works.

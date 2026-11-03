# Sport ERP

Multi-tenant SaaS for sports clubs: CRM, subscriptions, cash, attendance, payroll, Telegram bot.

## Stack
pnpm monorepo. `apps/api` NestJS + BullMQ worker + grammY. `apps/web` Next.js, Tailwind, shadcn/ui, TanStack Query, next-intl, PWA.
`packages/db` Drizzle + PostgreSQL. `packages/shared` zod schemas, enums, settings. `packages/billing-core` pure calculations.

## Step protocol
Work is split into steps in `docs/stages/`. For step X.Y:
1. Read only that step, plus any section it names. Do not read other stage files, `docs/DECISIONS.md` or the TZ.
2. Open only files you need. Use Grep/Glob with a target. Do not list or explore the whole repo.
3. Implement the step only. No extra features, refactors or dependencies.
4. Test what you changed: `pnpm --filter <pkg> test <path>`. Run the full suite only at the end of the step.
5. Pipe long output: `... 2>&1 | tail -40`.
6. When acceptance passes: tick the step in `docs/PROGRESS.md`, add at most 3 lines of notes there, commit as `feat(sX.Y): <summary>`.
7. Final reply: at most 5 lines: done, failing or skipped items, decisions made. No file-by-file recap.

Do not narrate. Do not print files you wrote. If the same error survives 2 fix attempts, stop and report it with your best hypothesis. If the spec is ambiguous, take the simplest reading that keeps all invariants and log it in PROGRESS notes. Ask only when money could be wrong.

## Invariants (never break)
- Every tenant table has `club_id`, an RLS policy, and is accessed through `withTenant()`. Never trust a client-sent `club_id`.
- Money is integer UZS (`bigint`). No floats in money calculations. Round only through `billing-core`.
- Timestamps are UTC `timestamptz`; business dates are `date` in club timezone.
- `payments`, `payment_allocations`, `cash_movements`, `audit_logs` are append-only, enforced by DB trigger. Corrections are new rows.
- Each write: zod validation, authorization, one transaction, audit entry for finance or subscription changes.
- Notifications go only through `notification_outbox`, in the same transaction. Delivery failure never affects business data.
- Mask phones in logs. Never log tokens, passwords or child data.
- UI text only through i18n keys (`uz` first, `ru` files present). Code and identifiers in English.

## Patterns
- New API module or CRUD screen: read `docs/CONVENTIONS.md` once, then copy `athletes` after step 2.1 exists.
- Business rule values come from `club_settings`, never hardcoded.

## Commands
`pnpm dev` | `pnpm db:generate` | `pnpm db:migrate` | `pnpm db:seed` | `pnpm lint` | `pnpm typecheck` | `pnpm test`

# Compact instructions
Keep: current step ID, unfinished acceptance items, changed file paths, unresolved errors. Drop: passed test output, file contents, exploration.

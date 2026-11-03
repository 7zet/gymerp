# Progress

## Steps
- [x] 1.1 Monorepo and tooling
- [ ] 1.2 Database core and tenant isolation
- [ ] 1.3 Auth and RBAC
- [ ] 1.4 Web shell and club administration
- [ ] 2.1 Athletes and guardians
- [ ] 2.2 Groups, coaches, schedule
- [ ] 2.3 Import, demo data, stage demo
- [ ] 3.1 billing-core engine
- [ ] 3.2 Plans, subscriptions, charges
- [ ] 3.3 Payments, reversals, balance
- [ ] 3.4 Cashbox and finance screens
- [ ] 4.1 Attendance and coach PWA
- [ ] 4.2 Expenses and payroll
- [ ] 4.3 Reports and dashboard
- [ ] 5.1 Jobs and notification delivery
- [ ] 5.2 Telegram bot
- [ ] 5.3 Hardening, acceptance, staging

## Notes
<!-- Max 3 lines per step: only what a later step must know. -->
- 1.1: TypeScript pinned to 5.9 (typescript-eslint peer). Compose not run here (no Docker daemon); /health verified with DB down → 503 degraded.
- 1.1: `db:*` root scripts from CLAUDE.md not added yet; add them in 1.2 with packages/db (drizzle-kit).
- 1.1: Nest DI uses explicit @Inject (tsx/esbuild does not emit decorator metadata).

# Progress

## Steps
- [ ] 1.1 Monorepo and tooling (blocked: MinIO image)
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
- 1.1: `minio/minio` pull denied on Docker Hub and quay.io (401), so `docker compose up -d` fails; `up -d postgres postgres-test redis` works. Blocked until a MinIO image is chosen.
- 1.1: Host ports 5432 and 5433 are used by non-Docker processes. Dev ran with POSTGRES_PORT=5435, POSTGRES_TEST_PORT=5434, DATABASE_URL=...:5435; `/health` → ok/ok (DB, Redis).
- 1.1: `db:*` root scripts not added yet (add in 1.2). Nest DI uses explicit @Inject (tsx does not emit decorator metadata).

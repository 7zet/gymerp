# Conventions

## API
- Prefix `/api/v1`. Plural REST resources. Module layout: `<name>.module.ts`, `.controller.ts`, `.service.ts`, `.spec.ts`.
- DTOs are zod schemas in `packages/shared/src/<name>.ts`; web and API import the same schema and inferred type.
- Controllers only parse, authorize and call a service. Business logic lives in services.
- Errors: `{ "code": "STABLE_CODE", "message": "...", "details": {} }`. Web maps `code` to i18n.
- Lists: `?page&limit&sort&<filters>` returning `{ items, total }`. Default limit 25, max 100.
- Authorization: `@Roles(...)` plus a service-level scope check through `ScopeService` (2.1).

## Database
- UUIDv7 primary keys. Every tenant table: `club_id NOT NULL`, `created_at`, `updated_at`, RLS policy.
- Soft state uses `status` or `archived_at`. Do not hard-delete business rows.
- Migrations are generated and committed. Never edit an applied migration.
- Index tenant lookups starting with `club_id`.

## Web
- App Router. Server state only through TanStack Query hooks in `features/<name>/api.ts`.
- Forms: react-hook-form with the shared zod schema.
- Shared `DataTable`, `FormDialog`, `PageHeader`, `MoneyText`, `DateText`. Reuse before adding a component.
- Every screen handles loading, empty and error states.
- Coach attendance screen is mobile-first. Admin screens are desktop-first and must work on tablets.

## Tests
- Vitest. Integration tests use the real test Postgres from Compose.
- Each module tests: happy path, wrong role, wrong tenant.
- Keep tests behavior-focused. No snapshots.

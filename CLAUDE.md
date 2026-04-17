# EHR POC — top-level orientation

Local-only proof-of-concept EHR for a solo psychologist. Demonstrates credible use of the pinned stack + a realistic testing pyramid.

## Stack (pinned, April 2026)
- Next.js **16.2.4** App Router (Turbopack, React 19.2)
- Radix Themes **3.3**
- `@supabase/ssr` against local Supabase (CLI ≥ 2.75)
- Vitest (unit + integration) / Playwright (E2E) / pgTAP (policy + trigger)
- Recharts for the PHQ-9 line chart

## Auth model — important
There is **no login UI**. Everything runs as a fixed `SEEDED_CLINICIAN_ID = '11111111-1111-1111-1111-111111111111'`, declared in `lib/constants.ts` and mirrored in `supabase/seed.sql` + `supabase/migrations/0002_rls.sql` via the `seeded_clinician_id()` SQL function. RLS is enabled and all policies filter on that UUID, so the *pattern* is intact and a real auth layer can be swapped in later without schema changes.

## Run
```bash
supabase start                          # 643xx ports (see supabase/CLAUDE.md)
npm install
npm run dev                             # http://localhost:3000
```

## Test suites — run all four before claiming "done"
```bash
npm run test                 # unit
npm run test:integration     # integration vs real local Postgres
supabase test db             # pgTAP
npx playwright test          # E2E
```

## Non-obvious conventions this repo enforces
- **Don't mock Supabase.** Integration tests hit real local Postgres so RLS + generated columns + triggers are exercised. Mocking would hide the bugs the tests exist to catch.
- **Never widen scope out of the five core surfaces** (Dashboard, Clients+Intake, Appointments, Progress Notes, PHQ-9). Out of scope: real auth, billing/CPT billing logic, messaging, telehealth video, client portal, multi-clinician.
- **DB-level invariants are testable surface area**, not cruft. Keep generated columns / CHECK constraints / triggers where they are — the plan chose them so tests could assert them.

## Directory map
- `app/` — App Router pages + server actions. See `app/CLAUDE.md`.
- `lib/` — validation, constants, Supabase client factories, format helpers. See `lib/CLAUDE.md`.
- `supabase/` — migrations, seed, config.toml, pgTAP tests. See `supabase/CLAUDE.md`.
- `tests/` — unit + integration + E2E Playwright specs. See `tests/CLAUDE.md`.
- `proxy.ts` — Next 16 replacement for `middleware.ts`; wires Supabase session-refresh pattern even though we have no auth yet.

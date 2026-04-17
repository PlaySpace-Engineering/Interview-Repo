# EHR POC — solo psychologist

Proof-of-concept Electronic Health Record app built on **Next.js 16 (App Router) + Radix Themes 3 + Supabase (local)** with a test-first workflow for the clinical critical paths.

## Stack (pinned, April 2026)

- Node ≥ 20.9, TypeScript 5.7
- Next.js **16.2.4** (Turbopack default, React 19.2, async `cookies()` / `params`, `proxy.ts` replaces `middleware.ts`)
- Radix Themes **3.3**
- `@supabase/ssr` + `@supabase/supabase-js` against **local** Supabase (CLI v2.75+)
- Vitest (unit + integration) + Playwright (E2E) + pgTAP (policy/trigger)
- Recharts for the PHQ-9 line chart

## Running locally

```bash
supabase start        # Docker required. Ports bumped to 643xx to avoid clashes.
npm install
npm run dev           # http://localhost:3000 — no login required
```

`.env.local` points at the local Supabase instance. Keys are the standard local dev tokens.

## Tests (four layers)

```bash
npm run test               # unit (Vitest + jsdom)
npm run test:integration   # integration against real local Supabase
supabase test db           # pgTAP policy + trigger tests
npx playwright test        # Playwright happy-paths against npm run dev
```

All four suites currently pass. The integration + E2E suites create real rows in local Postgres and exercise RLS end-to-end.

## Browser walk-through

1. `/` — dashboard with seeded clinician, today's schedule, unsigned-notes badge.
2. `/clients/new` → intake → chart.
3. `/appointments/new` → appointment detail → mark attended → create SOAP note → Sign & lock.
4. `/assessments/<clientId>/phq9/new` → score → history chart with reference bands.
5. Item 9 > 0 surfaces an SI-flag callout on the history page.

## Auth

There is **no auth UI**. The app always acts as a seeded clinician UUID baked into `lib/constants.ts`, `supabase/seed.sql`, and `supabase/migrations/0002_rls.sql`. RLS is still enabled and all policies are keyed to that UUID — the pattern is intact so real auth can be swapped in later.

## What the DB invariants look like

- `progress_notes.locked` → trigger `progress_notes_lock_guard` rejects any UPDATE where `OLD.locked = true`. Pattern: sign-and-lock is one atomic UPDATE (OLD was false), and subsequent edits raise. Addendums live on `note_addendums`.
- `assessments.total_score`, `severity_band`, `si_flag` → generated columns (STORED). PHQ-9 CHECK constraints enforce length=9 and values in 0..3.
- RLS policies filter by a constant seeded clinician UUID via a SQL helper function `seeded_clinician_id()`.

## Gotchas this codebase already handles

- Next 16 async cookies/params/searchParams (see `lib/supabase/server.ts`, page files).
- Radix CSS import order — `@radix-ui/themes/styles.css` is imported *before* `./globals.css` in the root layout.
- `middleware.ts` deprecated → `proxy.ts` wires the Supabase session-refresh pattern even though we have no auth yet.
- Vitest integration runs single-threaded to avoid cross-test FK/RLS collisions.
- Sign-and-lock inside a Radix AlertDialog uses HTML5 `form="newNoteForm"` so the portal-rendered submit button still posts the outer form.

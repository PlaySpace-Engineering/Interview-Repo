# HANDBOOK.md — EHR POC Senior Interview

## 1. Overview

This repository is a deliberately-broken clone of the `ehr-poc` local proof-of-concept built on Next.js 16.2.4 (App Router, Turbopack, React 19.2), Radix Themes 3.3, `@supabase/ssr` against a local Supabase stack (ports 64321-64329), Vitest for unit + integration tests, Playwright for E2E, and pgTAP for database policy and trigger tests. Branch `main` is pristine and all four test suites pass. Branch `interview` contains 24 planted defects distributed across Easy (#1-7), Medium (#8-18), and Hard (#19-24) tiers that together stress every layer of the stack: form/action contracts, server component data fetching, Next 16 async-params migration, Radix token usage, Zod validation, JSONB shape drift, database generated columns, row-level security, constraints, seed-data contracts, and middleware/proxy matchers.

The candidate is a senior full-stack engineer with a 90-120 minute slot. They have an editor, `npm run dev`, all four test suites, and AI-assisted review tooling (Cursor, Claude `/review`, etc.). They do not need `psql` or `EXPLAIN ANALYZE` — every assertion is reachable through the suites or the dev console. They should be encouraged to read the `CLAUDE.md` orientation files at `/CLAUDE.md`, `app/CLAUDE.md`, `lib/CLAUDE.md`, `lib/supabase/CLAUDE.md`, `supabase/CLAUDE.md`, and `tests/CLAUDE.md`.

Ground rules for the interviewer: let the candidate drive. Probe, don't lecture. Pick 6-10 issues that fit the candidate's interests, depth, and remaining clock. Do not try to hit all 24 — that is not the exercise. The catalogue exists so the interviewer can match probes to signals they see in real time. When the candidate seems confident in a category, skip issues in that category and push depth in a weaker area. When the candidate is thrashing, drop to an Easy in a different domain to re-anchor them and then raise difficulty again.

Several plants intentionally cascade: Plant #23 (wrong seeded clinician UUID) masks #15, #16, #19, and #20 until it is resolved. Plant #17 (zero-minute seed row) aborts every seed transaction and therefore every integration/E2E run that relies on seed. Plant #10 (missing `action.bind`) masks Plant #3 (sync `params`) in `tsc` output because the compiler halts at the first file. These cascades are pedagogical, not accidental — they rehearse the "single-point blast radius" reality of production.

## 2. Interviewer workflow

### 2.1 Before the interview

Run these, in order, in a fresh terminal:

```bash
cd /path/to/InterviewRepo4
git fetch --all --prune
git checkout interview
npm ci
supabase start
npm run db:reset        # WILL FAIL at seed due to Plant #17 — expected
```

`supabase start` boots the local Postgres, Studio, and auth stack on ports 64321-64329 (see `supabase/CLAUDE.md` for the port-range rationale). `npm run db:reset` will apply all migrations cleanly and then halt inside `supabase/seed.sql` when the appointment with `end_at = start_at` trips the `check (end_at > start_at)` constraint. Do not patch this before the interview — it is Plant #17 and the candidate is supposed to experience the cascade. Recover between candidates per Appendix C (§7).

Open four terminals so the interviewer can observe the candidate's signals without breaking flow:

1. `npm run dev` — primary dev server, watch the console for Next 16 sync-params warnings, React key warnings, service-role bundle warnings, and uncaught 500s.
2. `npm run test -- --watch` — unit watch (Vitest) for fast feedback on `lib/validation/*` probes.
3. A scratch terminal for `npm run test:integration`, `supabase test db`, `npx playwright test`, and `npm run build` on demand.
4. A scratch terminal for `git status` / `git diff` inspection while the candidate edits.

Skim §4 once before the session. Highlight two Easy, three Medium, and one Hard that you want to be able to reach for depending on the candidate's trajectory.

### 2.2 During the interview

Five-minute orientation to read to the candidate (adapt in your own voice):

> "This is a local-only EHR proof-of-concept for a solo psychologist, built on Next 16 with Radix, `@supabase/ssr`, and a real local Postgres. The `main` branch is green across unit, integration, pgTAP, and Playwright. This branch — `interview` — has planted defects. I'm not going to tell you how many. Your job over the next 90-ish minutes is to find as many as you can, explain them, and either fix them or tell me exactly what you'd do with more time. You can use any tool you would on the job, including AI review assistants. The four test suites are `npm run test`, `npm run test:integration`, `supabase test db`, and `npx playwright test`. There are several `CLAUDE.md` files — read them, they are orientation for you. Talk out loud. When you find something, tell me what you'd tell a teammate in a PR review."

Pacing: Easy tier is warm-up — two to three of #1-#7 in the first 20 minutes calibrates the candidate's debugging loop. Medium tier (#8-#18) is the core 45-60 minutes. Hard tier (#19-#24) is a stretch goal. Do not force it. A candidate who handles the Medium tier with clear reasoning and honest hypotheses is hireable without ever touching the Hard tier.

**On-track vs struggling signal grid**

| Tier | On-track after… | Struggling if at… |
| --- | --- | --- |
| Easy | ~15 min in, 2+ Easy issues found | Easy tier still open at 25 min |
| Medium | ~60 min in, 2+ Medium issues found | no Medium insight by 75 min |
| Hard | optional; only attempt if Easy+Medium flowed | — |

When the candidate is struggling, the fastest re-anchor is `npm run test` — the unit suite is fast and #5 (severity band off-by-one) will surface in under a second. That gives the candidate a concrete first win. When the candidate is flying, jump them directly to `npm run build` to surface the type-layer plants (#3, #10, #24) all at once.

### 2.3 After the interview

Write up against the scoring rubric in §9 within ten minutes of the session ending — signals fade fast.

Expected failing-test snapshot before the candidate touches anything (useful as a diff target for post-session re-runs):

- `npm run test`: 1 failure in `tests/unit/phq9.test.ts` ("maps all five bands" on `severityBand(4)`).
- `npm run test:integration`: multiple failures once seed is repaired — notably `note-sign-race`, `phq9-si-flag`, and `phq9.test.ts` expanded band case. `assessments-rls-transitive` and `notes-duplicate-per-appointment` remain masked until #23 is fixed.
- `supabase test db`: `rls_clinicians` assertion 2 failure.
- `npx playwright test`: `intake-to-signed-note` hangs at the textarea fill (Plant #9); `phq9-administer-and-chart` fails at submission (Plant #10). Several assertions (suicidal-ideation JSONB read, alertdialog role) are gated behind the earlier cascades.

If the candidate left fixes in place, run all four suites on their final state and note which plants they fully resolved versus partially addressed.

## 3. Per-issue entry format (schema used in §4)

Every catalogue entry in §4 uses these fields in this order:

- **Tier & Category** — one-line header (Easy | Medium | Hard, plus category).
- **Plant location** — absolute repo path and approximate line numbers.
- **Diff summary** — one-to-two lines describing what changed relative to `main`.
- **Discovery paths** — which of code review, dev server, test suite, or AI review will surface it.
- **Bucket** — breaks-existing-test, guided-by-new-failing-test, or slips-past.
- **Reproduce** — the exact command(s) that surface it.
- **Primary probe** — the one question you should ask if you only have one minute.
- **Graduated follow-ups** — L1 (surface mechanics), L2 (trade-offs), L3 (architectural or production-level). One sentence each.
- **Candidate signals** — Green, Yellow, Red — one concrete observable behaviour each.
- **Estimated time-to-find** — single number of minutes for a median senior candidate.

## 4. Catalogue

### 4.1 Easy (#1-#7)

#### #1 — DAP tab missing hidden format field

- **Tier & Category**: Easy — Forms / server actions.
- **Plant location**: `app/notes/new/[appointmentId]/page.tsx:72-84` (DAP tab panel).
- **Diff summary**: SOAP tab at line 55 has `<input type="hidden" name="format" value="SOAP" />`; DAP tab has no equivalent. `parseDraft` in `app/notes/actions.ts:15` falls back to `"SOAP"` when `format` is absent, so DAP submissions are interpreted as SOAP, find SOAP-named fields empty, and Zod's `nonEmpty` throws on insert.
- **Discovery paths**: dev (submit DAP from the UI, watch the action 500); AI review (should flag the asymmetry between tab panels).
- **Bucket**: slips-past — no existing E2E covers the DAP path.
- **Reproduce**: `npm run dev`, navigate to a new progress note, switch to the DAP tab, fill fields, submit. Action returns `Validation failed`.
- **Primary probe**: "Where should form/action contract drift be caught — in the form, the action, or both?"
- **Graduated follow-ups**:
  - L1: "How does the action know which format it received right now?"
  - L2: "What's the trade-off between a hidden input and a per-format action endpoint?"
  - L3: "How would you design the form-to-action contract so adding a third format (e.g. BIRP) cannot silently regress?"
- **Candidate signals**:
  - Green: notices the SOAP/DAP asymmetry in under three minutes by reading both panels side by side.
  - Yellow: reaches for console logs inside `parseDraft` before reading the JSX.
  - Red: rewrites the action to default to `"DAP"` instead of fixing the form contract.
- **Estimated time-to-find**: ~8 min.

#### #2 — Hardcoded hex replaces Radix token

- **Tier & Category**: Easy — UI / design system.
- **Plant location**: `app/appointments/page.tsx:81-82`.
- **Diff summary**: `background: "var(--indigo-3)"` became `"#EEF2FF"`; `border: "1px solid var(--indigo-6)"` became `"1px solid #C7D2FE"`. Dark-mode contrast breaks visually.
- **Discovery paths**: code review (`app/CLAUDE.md` forbids raw hex); AI review.
- **Bucket**: slips-past.
- **Reproduce**: open `app/appointments/page.tsx:81-82`; toggle the Radix theme appearance to dark in `app/layout.tsx` or OS-level.
- **Primary probe**: "How would you enforce the 'no raw hex' rule in CI?"
- **Graduated follow-ups**:
  - L1: "Why does Radix give us `--indigo-3` instead of `#EEF2FF`?"
  - L2: "What's the runtime cost of CSS variables vs hex literals?"
  - L3: "Beyond ESLint, what stops a designer pasting hex from Figma into a styled component?"
- **Candidate signals**:
  - Green: suggests a stylelint rule, codemod, or PR-time grep; cites the `CLAUDE.md` constraint.
  - Yellow: notices the hex but treats it as purely cosmetic.
  - Red: defends hex literals as simpler.
- **Estimated time-to-find**: ~5 min.

#### #3 — Unawaited params in appointments detail

- **Tier & Category**: Easy — Next 16 migration.
- **Plant location**: `app/appointments/[id]/page.tsx` — props signature and first line of the component.
- **Diff summary**: `params: Promise<{ id: string }>` reverted to sync, `await params` removed. Next 16 logs a sync-params warning in dev and `npm run build` errors.
- **Discovery paths**: dev console warning; `npm run build` type error. Currently masked behind Plant #10 in `tsc` output — surfaces once #10 is resolved.
- **Bucket**: breaks `npm run build`.
- **Reproduce**: `npm run build` (after fixing #10); or `npm run dev` and navigate to an appointment detail.
- **Primary probe**: "Why did Next 16 make these APIs async — what class of bug did it fix?"
- **Graduated follow-ups**:
  - L1: "What happens if you read `params.id` without awaiting in Next 16?"
  - L2: "What does async `params` enable that sync didn't?"
  - L3: "If you were migrating a large Next 13 codebase, how would you sequence this change?"
- **Candidate signals**:
  - Green: recognises the async `params` migration immediately and recalls the PPR / streaming rationale.
  - Yellow: fixes mechanically without articulating why.
  - Red: wraps the call in `React.use()` inside a non-client component.
- **Estimated time-to-find**: ~6 min once #10 is cleared.

#### #4 — Dashboard loses force-dynamic

- **Tier & Category**: Easy — Next 16 rendering.
- **Plant location**: `app/page.tsx:18`.
- **Diff summary**: `export const dynamic = "force-dynamic";` deleted. Dashboard is now statically rendered at build; writes to clients or appointments do not refresh the dashboard on next request.
- **Discovery paths**: dev observation (stale dashboard after create); `npm run build` output marks the route static.
- **Bucket**: slips-past.
- **Reproduce**: `npm run build` and read the route table; or create a client in the UI and watch the dashboard stay stale.
- **Primary probe**: "What are the alternatives to `force-dynamic` for per-request freshness?"
- **Graduated follow-ups**:
  - L1: "What's the default render mode for an App Router page?"
  - L2: "Compare `force-dynamic`, `revalidate = 0`, and `noStore()` — when would you pick each?"
  - L3: "If you wanted this dashboard to be fast and fresh, how would you architect caching?"
- **Candidate signals**:
  - Green: proposes `noStore()` at the fetch site or `revalidateTag` on the writing actions.
  - Yellow: re-adds `force-dynamic` without articulating the alternatives.
  - Red: doesn't notice because no test covers it.
- **Estimated time-to-find**: ~10 min.

#### #5 — Severity band off-by-one

- **Tier & Category**: Easy — validation.
- **Plant location**: `lib/validation/phq9.ts:51`.
- **Diff summary**: `if (total <= 4) return "None";` became `if (total < 4) return "None";`. A PHQ-9 score of 4 now returns "Mild" instead of "None".
- **Discovery paths**: unit test (`tests/unit/phq9.test.ts > maps all five bands`).
- **Bucket**: breaks-existing-test.
- **Reproduce**: `npm run test`.
- **Primary probe**: "Walk me through how you audit inclusive / exclusive boundaries in a scoring module."
- **Graduated follow-ups**:
  - L1: "What's the correct DSM-5 PHQ-9 banding for a total of 4?"
  - L2: "Would you prefer explicit `if` bands or a lookup table with boundary comments?"
  - L3: "If these bands drove clinical alerts, what defence-in-depth would you add beyond one unit test?"
- **Candidate signals**:
  - Green: reads the failing test output, jumps straight to the band function, fixes and reruns.
  - Yellow: fixes but doesn't look for the same pattern in `supabase/migrations/0006_severity_band.sql`.
  - Red: changes the test expectation to match the buggy code.
- **Estimated time-to-find**: ~3 min.

#### #6 — Array-index React keys

- **Tier & Category**: Easy — UI / React.
- **Plant location**: `app/assessments/[clientId]/phq9/new/page.tsx:~53`.
- **Diff summary**: Inner radio-option map uses the outer loop index `i` instead of the option's own id, producing duplicate keys inside each `RadioGroup`. React dev warns.
- **Discovery paths**: dev console warnings; AI review.
- **Bucket**: slips-past.
- **Reproduce**: `npm run dev`, navigate to the new PHQ-9 form, open dev tools, observe the "Encountered two children with the same key" warning.
- **Primary probe**: "When is an index-based key fine, and when does it break?"
- **Graduated follow-ups**:
  - L1: "What does React actually do with `key`?"
  - L2: "Describe a concrete bug you've seen caused by unstable keys."
  - L3: "How would you enforce stable keys in a team without adding review friction?"
- **Candidate signals**:
  - Green: names reconciliation and proposes `value`-based keys.
  - Yellow: fixes but cannot articulate the downstream user-visible bug.
  - Red: claims index keys are always fine.
- **Estimated time-to-find**: ~7 min.

#### #7 — Search input has decorative-only label

- **Tier & Category**: Easy — UI / accessibility.
- **Plant location**: `app/clients/page.tsx:48-57`.
- **Diff summary**: A visible `<Text>Search</Text>` sits above the search `TextField` with no `htmlFor`, no `aria-label`, and no `aria-labelledby`. Screen readers announce the field as unlabelled.
- **Discovery paths**: AI review; axe / Lighthouse; manual keyboard traversal.
- **Bucket**: slips-past.
- **Reproduce**: `npm run dev`, navigate to `/clients`, inspect the search input. A `getByLabel('Search clients')` Playwright assertion would fail.
- **Primary probe**: "How do you bake a11y regressions into CI?"
- **Graduated follow-ups**:
  - L1: "What exactly does a screen reader read out for this input today?"
  - L2: "`aria-label` vs `<label htmlFor>` vs visually-hidden `<label>` — when do you pick each?"
  - L3: "Where would you put axe in a pipeline for a regulated healthcare product?"
- **Candidate signals**:
  - Green: pairs the visible text with `htmlFor` + matching `id` rather than reaching for `aria-label`.
  - Yellow: fixes with `aria-label` and loses the visible text in the next iteration.
  - Red: does not notice without AI assistance.
- **Estimated time-to-find**: ~8 min.

### 4.2 Medium (#8-#18)

#### #8 — PHQ-9 action loses integer guard

- **Tier & Category**: Medium — validation.
- **Plant location**: `app/assessments/actions.ts:14`.
- **Diff summary**: `!Number.isInteger(n)` became `Number.isNaN(n)`. A fractional string like `"2.5"` now passes the action guard and reaches the DB, which rejects it with a less actionable error.
- **Discovery paths**: dev (submit fractional via browser devtools by editing the hidden input); code review. Guided test `tests/integration/phq9-action-coercion.test.ts` is a DB-layer probe that PASSES on both `main` and `interview` — it is a probe, not a gate. That makes this plant specifically a code-review / AI-review target.
- **Bucket**: slips-past.
- **Reproduce**: `npm run dev`; in the browser console, inject `document.querySelector('input[name="q0"]').value = '2.5'` before submit; observe the cryptic DB error. Or read the diff between the guard and the call-sites.
- **Primary probe**: "Where should runtime type guards live — in the action, the validator, the DB, or all three?"
- **Graduated follow-ups**:
  - L1: "What's the observable difference between `!Number.isInteger(n)` and `Number.isNaN(n)` for the input `'2.5'`?"
  - L2: "We already have a DB `CHECK`. Why bother guarding in the action?"
  - L3: "Design the three-layer validation contract you'd want for a form that writes to a check-constrained column."
- **Candidate signals**:
  - Green: notices the semantic change, explains the difference, reinstates the integer guard.
  - Yellow: deletes the guard entirely because "the DB already has a CHECK".
  - Red: does not see the diff and treats the existing guard as correct.
- **Estimated time-to-find**: ~12 min.

#### #9 — Intake textarea becomes read-only

- **Tier & Category**: Medium — forms / React.
- **Plant location**: `app/clients/[id]/intake/page.tsx:57`.
- **Diff summary**: `defaultValue={…}` became `value={…}` with no `onChange`. The field is now a controlled input with no state setter, which React warns about and Playwright cannot `.fill(…)`.
- **Discovery paths**: E2E (`intake-to-signed-note` spec hangs at `.fill`); dev console warning.
- **Bucket**: breaks-existing-test.
- **Reproduce**: `npx playwright test intake-to-signed-note`.
- **Primary probe**: "Controlled vs uncontrolled in a server-action world — what does `defaultValue` actually buy us?"
- **Graduated follow-ups**:
  - L1: "What does React log when you render `<textarea value={x} />` without `onChange`?"
  - L2: "If you wanted the field to be reactive to another component, how would you reconcile that with server actions?"
  - L3: "Walk me through your default stance: reach for `defaultValue` or `value`, and why?"
- **Candidate signals**:
  - Green: recognises the controlled/uncontrolled split, explains the `onChange` requirement, restores `defaultValue`.
  - Yellow: adds an empty `onChange={() => {}}` to silence the warning.
  - Red: wraps the whole page in `"use client"` to add state.
- **Estimated time-to-find**: ~10 min.

#### #10 — PHQ-9 form drops bound clientId

- **Tier & Category**: Medium — forms / server actions.
- **Plant location**: `app/assessments/[clientId]/phq9/new/page.tsx`.
- **Diff summary**: `const bound = submitPHQ9Action.bind(null, clientId);` removed and `<form action={bound}>` became `<form action={submitPHQ9Action}>`. The action now receives `FormData` as its first positional arg instead of `clientId`, so it 500s. Also produces a type error in `npm run build` that masks Plant #3.
- **Discovery paths**: E2E (`phq9-administer-and-chart`); `npm run build`.
- **Bucket**: breaks-existing-test AND breaks-build.
- **Reproduce**: `npm run build` or `npx playwright test phq9-administer-and-chart`.
- **Primary probe**: "What is `action.bind` doing on the server — what replaced it in newer React?"
- **Graduated follow-ups**:
  - L1: "What's the runtime shape of the arguments to a bound server action?"
  - L2: "`action.bind` vs a hidden `<input name='clientId'>` — trade-offs?"
  - L3: "If you were designing the action contract from scratch, how would you pass route-scoped identifiers?"
- **Candidate signals**:
  - Green: restores `bind`, explains why it matters for parameter ordering.
  - Yellow: adds a hidden input for `clientId` without acknowledging the security implications of client-supplied IDs.
  - Red: rewrites the action signature destructively.
- **Estimated time-to-find**: ~12 min.

#### #11 — Service-role client imported into client chart

- **Tier & Category**: Medium — security.
- **Plant location**: `app/assessments/[clientId]/history/chart.tsx`.
- **Diff summary**: Adds `import { createSupabaseServiceClient } from '@/lib/supabase/service'` plus a dead `if (false) createSupabaseServiceClient();` stub labelled "realtime subscription placeholder". Because the file has `"use client"`, the import pulls `SUPABASE_SERVICE_ROLE_KEY` toward the browser bundle.
- **Discovery paths**: `npm run build` warning about environment-variable leakage; code review against `lib/supabase/CLAUDE.md` which explicitly forbids this; AI review. A `page.on('pageerror')` assertion in the PHQ-9 spec will catch it if reached.
- **Bucket**: slips-past unit/integration/pgTAP; build warning and conditional E2E.
- **Reproduce**: `npm run build` (watch for the service-role warning) or read the imports in `chart.tsx`.
- **Primary probe**: "How do you prevent secret leakage at build time, not at review time?"
- **Graduated follow-ups**:
  - L1: "What is the service-role key and why shouldn't it be in the browser bundle?"
  - L2: "If you needed realtime here, what's the right architecture?"
  - L3: "What automation would have stopped this PR from merging?"
- **Candidate signals**:
  - Green: removes the import, proposes anon-client realtime, cites `lib/supabase/CLAUDE.md`.
  - Yellow: deletes the dead code but does not notice the bundle implication.
  - Red: defends the stub as harmless because it's inside `if (false)`.
- **Estimated time-to-find**: ~15 min.

#### #12 — signNoteAction read-then-update race

- **Tier & Category**: Medium — concurrency / SQL.
- **Plant location**: `app/notes/actions.ts` inside `signNoteAction`.
- **Diff summary**: A `await new Promise(r => setTimeout(r, 50));` has been inserted between the SELECT that checks `locked` and the UPDATE that sets signature fields. The UPDATE still lacks `.eq("locked", false)`, so two parallel signers can both read unlocked, both enter the UPDATE path, and the second hits the DB lock trigger with a confusing "row is locked" error.
- **Discovery paths**: guided integration test `tests/integration/note-sign-race.test.ts` fires two concurrent sign attempts and asserts no failure message should match `/locked/`.
- **Bucket**: guided-by-new-failing-test.
- **Reproduce**: `npm run test:integration -- note-sign-race`.
- **Primary probe**: "Write the single SQL statement that eliminates this race."
- **Graduated follow-ups**:
  - L1: "Why is 'read, then update' unsafe here?"
  - L2: "Compare optimistic locking (add `.eq('locked', false)`) vs `SELECT … FOR UPDATE`."
  - L3: "Where in the stack — app, trigger, or advisory lock — should we prevent this class of bug?"
- **Candidate signals**:
  - Green: collapses the read and write into a single `UPDATE … WHERE locked = false` and checks affected-rows.
  - Yellow: removes the `setTimeout` and declares victory.
  - Red: adds a JS-side mutex.
- **Estimated time-to-find**: ~15 min.

#### #13 — updateClientStatusAction drops enum cast

- **Tier & Category**: Medium — types / security scope.
- **Plant location**: `app/clients/actions.ts:49`.
- **Diff summary**: `.update({ status: status as 'active' | 'inactive' | 'waitlist' | 'discharged' })` became `.update({ status })`. Because the upstream `status` parameter is typed `string`, TypeScript does not catch this — but the Postgres enum will reject unknown strings with a cryptic error.
- **Discovery paths**: code review (compare against `saveIntakeAction` and `createClientAction` on the same file).
- **Bucket**: slips-past.
- **Reproduce**: read `app/clients/actions.ts` end-to-end; the pattern is inconsistent.
- **Primary probe**: "RLS already blocks cross-clinician writes. Why does scope / enum-casting in the action still matter?"
- **Graduated follow-ups**:
  - L1: "What will Postgres return if you pass `'archived'` to a status enum that has no `'archived'` member?"
  - L2: "If RLS stops unauthorised writes, what's the remaining job of an app-layer type guard?"
  - L3: "Design the type contract between `FormData`, a Zod schema, and a Supabase insert."
- **Candidate signals**:
  - Green: tightens the upstream parameter type OR restores the cast AND points at the missing Zod schema.
  - Yellow: adds the cast mechanically.
  - Red: defers to RLS.
- **Estimated time-to-find**: ~15 min.

#### #14 — clinicians_self policy USING becomes true

- **Tier & Category**: Medium — RLS.
- **Plant location**: `supabase/migrations/0003_rls_clinicians.sql` (new migration).
- **Diff summary**: Drops and recreates the `clinicians_self` policy with `using (true)`; `with check` predicate is unchanged. Anon can now SELECT every clinician row.
- **Discovery paths**: guided pgTAP test `supabase/tests/rls_clinicians.sql` — inserts a foreign clinician as transaction owner, switches to the anon role, and asserts anon cannot see it. Assertion 2 fails.
- **Bucket**: guided-by-new-failing-test.
- **Reproduce**: `supabase test db`.
- **Primary probe**: "USING vs WITH CHECK — which one protects what?"
- **Graduated follow-ups**:
  - L1: "What do the two clauses each restrict?"
  - L2: "Design a single policy that correctly scopes both read and write for a multi-tenant table."
  - L3: "Pros and cons of one compound policy vs two role-specific policies."
- **Candidate signals**:
  - Green: explains the USING/WITH CHECK split and restores the per-tenant predicate in USING.
  - Yellow: fixes mechanically without narrating the threat model.
  - Red: leaves `using (true)` and tightens WITH CHECK only.
- **Estimated time-to-find**: ~15 min.

#### #15 — assessments_owner transitive-only

- **Tier & Category**: Medium — RLS.
- **Plant location**: `supabase/migrations/0004_rls_assessments.sql` (new migration).
- **Diff summary**: Drops and recreates the `assessments_owner` policy with only the `EXISTS (SELECT 1 FROM clients WHERE clients.id = assessments.client_id AND clients.clinician_id = seeded_clinician_id())` predicate. The direct `clinician_id = seeded_clinician_id()` predicate in both USING and WITH CHECK is gone.
- **Discovery paths**: guided integration test `tests/integration/assessments-rls-transitive.test.ts` — inserts an assessment for a seeded client but with a foreign `clinician_id`. Without the direct predicate, the foreign row slips through WITH CHECK because the EXISTS subquery matches the seeded client.
- **Bucket**: guided-by-new-failing-test. IMPORTANT — currently masked by Plant #23. With the wrong `seeded_clinician_id()` returning `…1112`, the EXISTS subquery returns empty, WITH CHECK blocks the insert, and the test's `expect(error).not.toBeNull()` coincidentally passes. The candidate must resolve #23 before this test surfaces the plant.
- **Reproduce**: fix #23, then `npm run test:integration -- assessments-rls-transitive`.
- **Primary probe**: "Pros and cons of transitive vs direct RLS predicates."
- **Graduated follow-ups**:
  - L1: "What does the EXISTS subquery protect, and what does it not?"
  - L2: "When would transitive-only be correct?"
  - L3: "If you owned this RLS policy catalogue, how would you test it generatively?"
- **Candidate signals**:
  - Green: explains that the direct predicate protects against "attach to owned client but attribute to foreign clinician" and restores it.
  - Yellow: fixes without noticing the cascade with #23.
  - Red: reasons only about the read side.
- **Estimated time-to-find**: ~20 min after #23 is fixed.

#### #16 — Drop progress_notes.appointment_id UNIQUE

- **Tier & Category**: Medium — DB constraints.
- **Plant location**: `supabase/migrations/0005_drop_pn_unique.sql` (new migration).
- **Diff summary**: `alter table progress_notes drop constraint progress_notes_appointment_id_key;`. Two progress notes per appointment can now coexist.
- **Discovery paths**: guided integration test `tests/integration/notes-duplicate-per-appointment.test.ts` — inserts two notes for the same appointment; on `main` the second fails with a UNIQUE violation.
- **Bucket**: guided-by-new-failing-test. Also masked by #23 until that is fixed (seeded queries return zero rows; test preconditions break).
- **Reproduce**: fix #23, then `npm run test:integration -- notes-duplicate-per-appointment`.
- **Primary probe**: "How do DB-level invariants complement app validation?"
- **Graduated follow-ups**:
  - L1: "Why did the UNIQUE constraint exist in the first place?"
  - L2: "If product says an appointment can have multiple note drafts, how would you model it?"
  - L3: "How would you roll a down-migration that restores UNIQUE safely in prod?"
- **Candidate signals**:
  - Green: restores the UNIQUE and explicitly asks whether it's a product change or a regression.
  - Yellow: adds an app-layer guard instead of restoring the constraint.
  - Red: doesn't notice until the test fails.
- **Estimated time-to-find**: ~15 min after #23 is fixed.

#### #17 — Seed: middle appointment has 0-minute duration

- **Tier & Category**: Medium — seed / DB constraints.
- **Plant location**: `supabase/seed.sql:62`.
- **Diff summary**: `interval '16 hour 60 minute'` became `interval '16 hour'`, so `end_at = start_at`. The `check (end_at > start_at)` constraint defined in `supabase/migrations/0001_init.sql:66` rejects the row. Every downstream seed statement — progress notes, assessments — is aborted because the transaction bails.
- **Discovery paths**: `supabase db reset` fails loudly at the appointments INSERT; integration and E2E suites then see a mostly-empty database.
- **Bucket**: breaks `supabase db reset` — cascades into every test run.
- **Reproduce**: `npm run db:reset`.
- **Primary probe**: "How do you keep seed data in lockstep with evolving constraints?"
- **Graduated follow-ups**:
  - L1: "Why does the rest of the seed also fail to insert?"
  - L2: "Would you CI this seed in isolation? What would that cost?"
  - L3: "Design the migration + seed review process that makes this unshippable."
- **Candidate signals**:
  - Green: reads the Postgres error, identifies the constraint, fixes the interval, explains the transactional cascade.
  - Yellow: guesses a random interval.
  - Red: disables the constraint.
- **Estimated time-to-find**: ~8 min (but this is usually the first thing the candidate hits, so it anchors early).

#### #18 — proxy.ts matcher too broad

- **Tier & Category**: Medium — Next 16 / performance.
- **Plant location**: `proxy.ts:31`.
- **Diff summary**: `["/((?!_next/static|_next/image|favicon.ico).*)"]` became `["/:path*"]`. Every `_next/static/*` request now instantiates a server Supabase client and walks the SSR session-refresh path.
- **Discovery paths**: dev observation (Network tab + dev server logs show the middleware firing on asset requests). No automated assertion — a planned Playwright assertion was deemed flaky and removed.
- **Bucket**: slips-past.
- **Reproduce**: `npm run dev`, open the Network tab, filter `_next/static/`, watch the dev server log a matcher hit per asset.
- **Primary probe**: "How do you reason about middleware/proxy matchers for performance and correctness?"
- **Graduated follow-ups**:
  - L1: "What happens on every middleware invocation here?"
  - L2: "How would you measure the impact in prod?"
  - L3: "What's your mental model for ordering matcher negations when multiple proxies compose?"
- **Candidate signals**:
  - Green: restores the asset exclusion and cites the Supabase SSR cost.
  - Yellow: restores it but cannot explain the cost.
  - Red: doesn't notice.
- **Estimated time-to-find**: ~18 min.

### 4.3 Hard (#19-#24)

#### #19 — severity_band generated column off-by-one

- **Tier & Category**: Hard — DB generated columns.
- **Plant location**: `supabase/migrations/0006_severity_band.sql` (new migration).
- **Diff summary**: Drops and recreates the `severity_band` generated column with `between 0 and 3` for 'None'. The JS severity function still uses `<= 4`, so app and DB disagree on score 4.
- **Discovery paths**: expanded case in `tests/integration/phq9.test.ts > maps each severity band` — specifically `[[1,1,0,1,1,0,0,0,0], 4, 'None']` — which asserts the DB returns "None" and fails with plant because DB returns "Mild".
- **Bucket**: breaks-existing-test (expanded). Masked by #23 until fixed.
- **Reproduce**: fix #23, then `npm run test:integration -- phq9`.
- **Primary probe**: "The unit test asserts the JS `severityBand`; the integration test asserts the DB column. Where should the canonical version live?"
- **Graduated follow-ups**:
  - L1: "What are the trade-offs between computing severity in JS vs as a generated column?"
  - L2: "If they must disagree during a rollout, which side wins — and how do you reconcile?"
  - L3: "Design a migration process that makes this class of app/DB drift impossible."
- **Candidate signals**:
  - Green: fixes the generated column, adds a comment tying it to the JS function, proposes a contract test.
  - Yellow: fixes the boundary without addressing drift.
  - Red: changes the JS to match the DB.
- **Estimated time-to-find**: ~20 min after #23 is fixed.

#### #20 — si_flag uses >= instead of >

- **Tier & Category**: Hard — DB generated columns.
- **Plant location**: `supabase/migrations/0007_si_flag.sql` (new migration).
- **Diff summary**: `si_flag boolean generated always as (coalesce(responses[9],0) >= 0) stored` — always true because non-negative integers are always `>= 0`. Should be `> 0`.
- **Discovery paths**: guided integration test `tests/integration/phq9-si-flag.test.ts` — zeros-only row should have `si_flag === false`.
- **Bucket**: guided-by-new-failing-test. Masked by #23 until fixed.
- **Reproduce**: fix #23, then `npm run test:integration -- phq9-si-flag`.
- **Primary probe**: "Comment your reasoning for inclusive vs exclusive in generated columns."
- **Graduated follow-ups**:
  - L1: "What clinical decision does `si_flag` drive?"
  - L2: "If a clinician relied on this flag in a dashboard, what remediation do you owe past users?"
  - L3: "How do you test generated-column semantics in CI so this cannot recur?"
- **Candidate signals**:
  - Green: fixes the operator, names the downstream user impact, suggests a test matrix of boundary values.
  - Yellow: fixes without a downstream impact assessment.
  - Red: doesn't notice the operator is inclusive.
- **Estimated time-to-find**: ~20 min after #23 is fixed.

#### #21 — Untyped JSONB cast on risk_assessment

- **Tier & Category**: Hard — types / JSONB.
- **Plant location**: writer at `app/notes/actions.ts` (`parseDraft`); reader at `app/notes/[id]/page.tsx:45`.
- **Diff summary**: Writer renamed the first key from `si` to `suicidal` and widened the draft type to `Record<string, boolean>`. Reader casts `risk_assessment as any`, so `risk.si` silently reads as `undefined`. The rendered card says "SI: no" regardless of input.
- **Discovery paths**: new Playwright assertion inside `intake-to-signed-note.spec.ts` — checks the "Suicidal ideation endorsed" box, signs, then asserts "SI: yes" is visible.
- **Bucket**: guided-by-new-failing-test. Gated behind Plant #9 (intake textarea), so the candidate must repair #9 before the spec reaches this assertion.
- **Reproduce**: fix #9, then `npx playwright test intake-to-signed-note`.
- **Primary probe**: "Where should runtime JSONB parsing happen to keep writer and reader in sync?"
- **Graduated follow-ups**:
  - L1: "What is the exact bug — wrong key or wrong type?"
  - L2: "Would you co-locate the Zod schema with the writer, reader, or a shared module?"
  - L3: "How would you harden JSONB shape in a regulated product — schema, trigger, both?"
- **Candidate signals**:
  - Green: aligns writer/reader on a shared Zod schema and removes the `as any`.
  - Yellow: renames one side without a shared type.
  - Red: casts the reader to match `'suicidal'` and calls it done.
- **Estimated time-to-find**: ~25 min after #9.

#### #22 — Sign-and-lock AlertDialog replaced with plain div

- **Tier & Category**: Hard — UI / accessibility.
- **Plant location**: `app/notes/new/[appointmentId]/sign-confirm.tsx`.
- **Diff summary**: Radix `AlertDialog.Root/Content/Cancel/Action` has been replaced with a `useState`-controlled `<div>` overlay. The button-by-name flow still works so existing E2E interactions succeed, but `role="alertdialog"`, focus trap, and ESC-to-dismiss are gone.
- **Discovery paths**: new Playwright assertion `await expect(page.getByRole('alertdialog')).toBeVisible();` after opening the confirm overlay; AI review flags missing role.
- **Bucket**: guided-by-new-failing-test. Gated behind earlier cascades.
- **Reproduce**: fix #9 and any gating plants, then `npx playwright test intake-to-signed-note`.
- **Primary probe**: "Walk me through the user cost of swapping a Radix primitive for a div."
- **Graduated follow-ups**:
  - L1: "What does `role='alertdialog'` provide that a `<div>` does not?"
  - L2: "ESC-to-dismiss, focus trap, initial focus — how many of those do you get for free with Radix?"
  - L3: "In a healthcare product, what's the governance story around shipping accessibility regressions?"
- **Candidate signals**:
  - Green: restores Radix AlertDialog, cites focus trap and ESC behaviour by name.
  - Yellow: adds `role='alertdialog'` to the div and claims parity.
  - Red: leaves the div and argues the test is too strict.
- **Estimated time-to-find**: ~20 min after prerequisites.

#### #23 — seeded_clinician_id() returns wrong UUID

- **Tier & Category**: Hard — RLS / security.
- **Plant location**: `supabase/migrations/0008_wrong_seed_uuid.sql` (new migration).
- **Diff summary**: Function body replaced with `select '11111111-1111-1111-1111-111111111112'::uuid` — trailing `2`. Every anon query now returns zero rows because no seeded clinician matches. Dashboard is empty; `clients.test.ts` `beforeAll` fails; E2E navigation sees empty lists.
- **Discovery paths**: any suite touching seed data — the integration suite `clients.test.ts` fails first. Playwright dashboard is visibly empty.
- **Bucket**: breaks-existing-tests. This plant masks #15, #16, #19, and #20 until repaired — intentional single-point blast radius.
- **Reproduce**: `npm run test:integration -- clients` or `npm run dev` and observe an empty dashboard.
- **Primary probe**: "One SQL function, one typo, every suite red. What alerting catches this class in production?"
- **Graduated follow-ups**:
  - L1: "Where is this UUID defined elsewhere, and which source is authoritative?"
  - L2: "If this were a real auth model, what's the right way to scope RLS without a literal UUID?"
  - L3: "Design a contract test that keeps `lib/constants.ts`, `supabase/seed.sql`, and `seeded_clinician_id()` in lockstep."
- **Candidate signals**:
  - Green: finds the function fast, fixes the UUID, notices the cascade unmask, reruns suites.
  - Yellow: patches `lib/constants.ts` instead of the SQL function.
  - Red: can't correlate empty results with RLS at all.
- **Estimated time-to-find**: ~18 min — but the blast radius makes it very obvious something is wrong.

#### #24 — Latent out-of-bounds in week view

- **Tier & Category**: Hard — types / defensive coding.
- **Plant location**: code change at `app/appointments/page.tsx:39`; activator in `supabase/seed.sql`.
- **Diff summary**: Code change turned `byDay[k]?.push(a)` into `byDay[k].push(a)`. Seed activator added a fourth appointment at `+ interval '8 days 10 hour'` (outside the current week). The day-key for that appointment is not in `byDay`, so the push crashes. Because the inferred `byDay` value type includes `null`, `npm run build` also trips on the non-null assertion implied by removing the optional chain.
- **Discovery paths**: dev (week view renders a `TypeError: Cannot read properties of undefined (reading 'push')`); `npm run build`.
- **Bucket**: slips-past. No automated test drives the week view; `noUncheckedIndexedAccess` would catch the OOB separately if enabled.
- **Reproduce**: `npm run dev`, navigate to `/appointments`; or `npm run build`.
- **Primary probe**: "Which `tsconfig` knobs pay for themselves in a healthcare codebase?"
- **Graduated follow-ups**:
  - L1: "What does the optional chain here actually protect against?"
  - L2: "Why does removing `?.` make the build fail rather than just crash at runtime?"
  - L3: "Design the tsconfig you'd ship for this product, with reasons for each strict flag."
- **Candidate signals**:
  - Green: restores the optional chain AND asks about `noUncheckedIndexedAccess`.
  - Yellow: restores the chain but doesn't follow the chain back to the seed activator.
  - Red: initialises `byDay[k] = []` inside the loop without understanding why.
- **Estimated time-to-find**: ~22 min.

## 5. Appendix A — Test-command cheatsheet

```bash
supabase start                          # boot local stack (64321-64329)
supabase stop                           # clean shutdown
npm run db:reset                        # drop + re-apply migrations + seed (fails at #17)
npm install                             # or npm ci for deterministic install
npm run dev                             # Next 16 dev on http://localhost:3000
npm run build                           # production build — surfaces #3, #10, #11, #24
npm run lint                            # next lint
npx tsc -p . --noEmit                   # pure type-check pass
npm run test                            # unit (Vitest)
npm run test -- --watch                 # unit watch
npm run test:integration                # integration vs real local Postgres
supabase test db                        # pgTAP policy + trigger tests
npx playwright test                     # E2E
npx playwright test <spec-name>         # single E2E spec
```

Run-everything chain, useful as a pre-interview smoke and post-interview diff:

```bash
npm run lint && \
npx tsc -p . --noEmit && \
npm run test -- --run && \
npm run test:integration -- --run && \
supabase test db && \
npx playwright test
```

## 6. Appendix B — Interviewer checklist

- Confirm `git branch --show-current` returns `interview`.
- Confirm `supabase status` shows all containers healthy on 64321-64329.
- Run `npm ci` so `node_modules` is reproducible.
- Attempt `npm run db:reset` — confirm it fails at the appointments INSERT (Plant #17); do not fix it yet.
- Open four terminals per §2.1.
- Pre-skim §4 and pre-select two Easy, three Medium, one Hard to steer toward.
- Confirm `npm run dev` serves at http://localhost:3000.
- Confirm `npx playwright test --list` prints the full spec list (does not require a passing DB).
- Read the opening script in §2.2 once silently before the candidate joins.
- Have the scoring rubric in §9 open in a side pane.

## 7. Appendix C — Reset & re-plant recipe

Between candidates:

```bash
cd /path/to/InterviewRepo4
git restore --source interview --staged --worktree :/
git clean -fd
git checkout interview
git reset --hard origin/interview        # only if you pushed; otherwise use the tagged HEAD
supabase db reset --no-seed              # drop the dev DB without running the broken seed
supabase start                           # if not already running
```

If the candidate committed their fixes locally, reset the working tree with `git reset --hard <interview-HEAD-sha>` where the SHA is captured at session start. If the candidate rewrote migrations, `supabase db reset --linked=false` plus a fresh `npm run db:reset` once the seed is unplanted will rebuild from the interview-branch files.

Per-issue unplant — to reinstate a single plant without a full reset:

- For empty-commit plants (#1): no-op, already planted.
- For code-only plants: `git checkout interview -- <paths>` to restore the planted version; `git checkout main -- <paths>` to unplant for debugging.
- For migration-add plants (#14, #15, #16, #19, #20, #23): delete the new migration file, then `npm run db:reset`. Restore by `git checkout interview -- supabase/migrations/<file>.sql`.
- For the #24 split: restore both the page change and the seed row atomically with `git checkout interview -- app/appointments/page.tsx supabase/seed.sql`.

To seed a clean workspace for a new candidate:

```bash
git checkout interview
git reset --hard <tagged-interview-HEAD>
npm ci
supabase db reset --no-seed              # unavoidable because of #17
supabase start
```

## 8. Appendix D — Known non-bugs (don't get trolled)

These patterns look suspicious but are intentional. If the candidate "fixes" them, treat it as a Yellow/Red signal for reading the `CLAUDE.md` orientation.

- `lib/supabase/server.ts:25` — the empty `catch {}` around `cookies().set` is intentional per the Supabase SSR cookie-write limitation inside RSCs. The fallback refresh happens in `proxy.ts`. Do not let the candidate replace it with `console.error` or throw.
- `playwright.config.ts:23` — `reuseExistingServer: !process.env.CI` is intentional dev ergonomics; it lets local runs skip a cold start.
- `tests/CLAUDE.md` explicitly documents `cleanupRowsById` as single-thread — concurrent cleanup will cascade foreign keys unpredictably. Do not let the candidate "improve" the helper.
- `supabase/CLAUDE.md` documents that pgTAP count assertions use `>=` rather than `=`, because rows persist across runs within a session. An `=` "correction" will break the suite on the next run.
- `supabase/seed.sql` keeps `'11111111-1111-1111-1111-111111111111'::uuid` as a bare literal in addition to the function — intentional because the seed runs as the transaction owner, not as anon.
- `proxy.ts` does not validate sessions; it only refreshes them. This is by design for the "no login UI" POC — a real auth layer slots in without touching the matcher.

## 9. Scoring rubric

Score the candidate across six dimensions. For each dimension, pick the single most representative signal from the session — Green, Yellow, or Red. Do not average; patterns of Yellow across dimensions are a different signal from Green-in-two-and-Red-in-one.

### Debugging approach

- Green: reads error messages end-to-end before changing code; forms a hypothesis before editing; verifies with the smallest possible rerun (`npm run test -- <file>`, not the whole suite).
- Yellow: edits first, reads later; runs the full suite on every change; fixes the symptom then looks for related cases.
- Red: trial-and-error with no articulated hypothesis; disables failing tests; leaves the stack trace unread.

### DB / SQL fluency

- Green: distinguishes USING vs WITH CHECK on #14; collapses the race in #12 into one `UPDATE … WHERE … = false`; recognises generated-column boundary bugs in #19 / #20 without running the suite.
- Yellow: fixes mechanically when pointed at the right file; conflates RLS read and write; avoids writing SQL.
- Red: "disable RLS to unblock the test"; cannot read a Postgres error message; edits `lib/constants.ts` to fix #23.

### Next 16 and React fluency

- Green: names the async-params migration on #3 without prompting; explains `action.bind` on #10 and its React equivalents; restores `force-dynamic` on #4 and articulates the alternatives; names the controlled/uncontrolled distinction on #9.
- Yellow: applies the right fix when pointed at it; cannot explain the rationale.
- Red: adds `"use client"` to server components; wraps server actions in `useEffect`; confuses `revalidate` with `cache`.

### Security instincts

- Green: catches the service-role leak in #11 by reading `lib/supabase/CLAUDE.md` unprompted; narrates the threat model for RLS (#14, #15); distinguishes auth from authz.
- Yellow: fixes #11 when flagged; treats RLS as a black box; calls `supabaseAdmin` "more powerful" without explaining scope.
- Red: imports the service-role client into the browser bundle deliberately; argues `seeded_clinician_id()` hard-coding is "fine in prod".

### Test discipline

- Green: writes a failing regression test for the first defect they find; uses Vitest's test-filter flags to iterate quickly; reads `tests/CLAUDE.md` before writing a new integration test.
- Yellow: changes tests to match buggy code on #5; runs suites more often than needed.
- Red: deletes tests to go green; ignores the guided probes in the integration suite.

### Communication

- Green: narrates hypotheses in the form "I think X because Y, so I'll verify by Z"; articulates the cascade on #23 before fixing; asks clarifying questions about scope and risk.
- Yellow: silent for long stretches then drops a solution; explains only after being asked.
- Red: defensive when challenged; talks over the interviewer; refuses to consider alternative approaches.

When writing up the session in §2.3, capture three things: which issues the candidate fully resolved (not just patched), which issues they identified but did not resolve, and the single most revealing quote of the session.

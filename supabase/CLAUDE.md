# supabase/ — schema, seed, policies, pgTAP

## Port remapping
This project's stack runs on **643xx** (not the default 543xx) because another project on this machine owns 543xx. Check `config.toml`:
- API `64321`, DB `64322`, DB shadow `64320`, pooler `64329`, Studio `64323`, Mailpit `64324`.
- Analytics is **disabled** (`[analytics] enabled = false`) because the `vector` container was unhealthy on colima Docker. Don't re-enable without verifying.

Mirrored in `.env.local` via `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:64321`.

## Migration conventions
- Files under `migrations/` are numbered `NNNN_description.sql`. Two exist:
  - `0001_init.sql` — tables, enums, constraints, PHQ-9 generated columns, note-lock trigger.
  - `0002_rls.sql` — RLS enabled + policies keyed to the `seeded_clinician_id()` SQL helper (not a literal UUID in every policy — keep the indirection).
- **Never edit a committed migration** after it has been applied to the local DB. Add a new `NNNN_` file instead.

## DB-level invariants you must not weaken
- `progress_notes` has a `before update` trigger `progress_notes_lock_guard` that raises if `OLD.locked = true`. Sign-and-lock is a single atomic UPDATE (OLD was still false). After that, *no* edits to the row are permitted. Addendums live in a separate table (`note_addendums`) so they are inserts, not updates.
- `assessments.total_score`, `severity_band`, `si_flag` are **STORED generated columns**. Clients cannot override them; don't add app-side calculation that duplicates them.
- `assessments.responses` has CHECK constraints enforcing array length = 9 and values in 0..3.

## pgTAP tests (`supabase/tests/`)
- Run with `supabase test db`. The runner uses a transaction per file so tests are isolated from each other, but **not** from seed data or rows created by prior app runs.
- Count-based assertions should use `cmp_ok(... '>=' ...)` rather than exact `is(..., 3, ...)`, because the E2E suite and integration tests create additional rows that persist between runs. Don't tighten them without a reset strategy.
- `rls_clients.sql` asserts anon role can only see/write rows for the seeded clinician UUID.
- `rls_notes.sql` asserts the same for notes + addendums.
- `note_lock_trigger.sql` asserts sign-and-lock + rejection of post-lock edits + addendum insertability.

## Seed (`seed.sql`)
Deterministic UUIDs for clinician / clients / appointments / note so tests can reference them:
- Clinician `11111111-…-1111-111111111111`
- Jamie Chen `22222222-…-2222-222222222221`
- Taylor Okafor `22222222-…-2222-222222222222`
- Signed note `44444444-…-4441`
Keep the UUID shape; tests and fixtures hardcode these.

## Commands
```bash
supabase start           # boot stack
supabase stop            # stop
supabase db reset        # drop+recreate+reapply migrations+reseed (NUKES data)
supabase gen types typescript --local 2>/dev/null > lib/database.types.ts
supabase test db         # pgTAP runner
```

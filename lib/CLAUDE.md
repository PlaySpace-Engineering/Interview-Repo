# lib/ — framework-free modules

Everything under `lib/` is importable from both server and client code (with the exception of `lib/supabase/{server,service}.ts` — see `lib/supabase/CLAUDE.md`).

## What lives here
- `constants.ts` — `SEEDED_CLINICIAN_ID`, CPT codes, client statuses, interventions. Single source of truth; any change here must be mirrored in `supabase/seed.sql` for the UUID.
- `database.types.ts` — **generated**. Regenerate with `npm run db:types`. Never hand-edit.
- `format.ts` — date/time formatters + `startOfWeek` / `addDays` for the calendar.
- `validation/phq9.ts` — pure PHQ-9 scoring, severity band, SI flag. **No DB access.** Tested by `tests/unit/phq9.test.ts`.
- `validation/note.ts` — Zod `discriminatedUnion` for SOAP vs DAP note content. Tested by `tests/unit/note-format.test.ts`.
- `supabase/*` — three client factories (see `lib/supabase/CLAUDE.md`).

## Rules
- **Validators must stay pure.** No `async`, no `fetch`, no Supabase. If you need DB-aware validation, do it in a Server Action that *calls* the validator, not inside the validator.
- **Don't leak secrets into `constants.ts`.** Keys + URLs belong in `.env.local` and are read via `process.env.*` at the point of use.
- **Generated types**: after any schema migration, run `npm run db:types`. Redirect stdout with `2>/dev/null` to avoid the CLI's "Connecting to db 5432" line being written into the file (this has bitten us once).

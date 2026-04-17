# tests/ — the pyramid

Four layers, each with a distinct purpose. All four must pass before a change ships.

## `unit/` (Vitest + jsdom)
- Config: `vitest.config.mts`. Fast, parallel, no DB.
- Current coverage: PHQ-9 scoring / severity / SI flag, SOAP + DAP Zod validation.
- **Unit tests are pure-function only.** If a test needs Supabase, it goes under `integration/` instead.

## `integration/` (Vitest, Node env, real local Supabase)
- Config: `vitest.integration.config.mts`. **Single-threaded** (`poolOptions.threads.singleThread: true`) — parallel test files can race on FK/RLS behaviour.
- Tests exercise real RLS, real generated columns, and the lock trigger via the anon client. The service client is only used in `afterAll` cleanup helpers.
- `_helpers.ts` exposes seeded UUIDs and a `cleanupRowsById(table, ids)` helper. Always register IDs to clean up in `afterAll` so repeated runs stay idempotent.
- **Never mock Supabase here.** That defeats the whole point of the layer.

## `e2e/` (Playwright)
- Two specs: intake → signed SOAP note, and PHQ-9 administer × 2 + chart + SI flag.
- Config: `playwright.config.ts`. Runs `npm run dev` via `webServer`, sequential (1 worker), Chromium only.
- **Don't rely on strict heading uniqueness.** Playwright's `getByRole("heading", { name: "..." })` matches partial. We already hit this with "Today" vs "Today's schedule" — use `{ exact: true }` when collisions are possible.
- Radix `RadioGroup` renders `button[role="radio"][value="..."]` — click via `page.locator('[role="radiogroup"]').nth(i).locator('button[role="radio"][value="X"]')`, not `input[name=...]`.
- E2E tests create real rows that persist across runs. Plan for that in pgTAP assertions (use `>=` not exact counts) and in UI queries (they'll see more rows over time).

## Suite matrix
| Layer       | Command                      | What it proves                                              |
|-------------|------------------------------|-------------------------------------------------------------|
| unit        | `npm run test`               | Pure logic (scoring, validation) is correct.               |
| integration | `npm run test:integration`   | Schema + RLS + generated cols + lock trigger hold end-to-end. |
| pgTAP       | `supabase test db`           | DB policies and triggers independently of the app.         |
| e2e         | `npx playwright test`        | The two user-visible happy paths actually work in a browser. |

## Adding tests
- Reach for the **lowest layer that gives you signal**. Prefer a unit test over integration over E2E when a pure-function test would catch the same bug.
- Don't duplicate coverage across layers without intent — e.g. PHQ-9 scoring has a unit test (pure) **and** an integration test (generated-column correctness), because they're asserting different things.

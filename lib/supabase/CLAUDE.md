# lib/supabase/ — pick the right client

Three factories. Pick by caller context — importing the wrong one is the single most common bug in App Router + Supabase setups.

## `server.ts` → `createSupabaseServerClient()`
- Use from RSCs, Server Actions, Route Handlers. Returns a typed `@supabase/ssr` server client.
- `cookies()` is **awaited** (Next 16 async API).
- `setAll` is wrapped in try/catch because RSCs cannot write cookies; session mutation only happens from Server Actions / Route Handlers / `proxy.ts`. That's intentional per the Supabase SSR design doc — don't "fix" it.

## `client.ts` → `createSupabaseBrowserClient()`
- Use only from `"use client"` modules. Right now only used for potential future realtime subscriptions; the POC itself is all RSC.

## `service.ts` → `createSupabaseServiceClient()`
- **Bypasses RLS.** Use *only* from test fixtures/teardown. Never import it from `app/` code.
- Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Guarded with a runtime check.

## Never
- Never pass a server client to a client component.
- Never `new createClient(...)` directly from app code — always go through these factories so cookie handling, typing, and RLS behaviour stay consistent.

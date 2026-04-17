# app/ — App Router conventions

Every page is a React Server Component unless it explicitly opts out with `"use client"`. Data fetching happens in the RSC; forms post to **Server Actions** colocated as `actions.ts` per feature folder.

## Next 16 gotchas that *must* be respected
- `cookies()`, `headers()`, `params`, `searchParams` are **async**. Always `await` them. Example:
  ```ts
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    ...
  }
  ```
- `middleware.ts` is deprecated on Next 16 → we use root-level `proxy.ts`. Don't reintroduce `middleware.ts`.
- `experimental.typedRoutes` was promoted; `next.config.ts` sets it at the top level (`typedRoutes: false`).

## Server / client boundary rules
- RSCs must not import anything from `"@radix-ui/themes"` that needs a client event handler. The dashboard, list pages, detail pages, and forms here are all RSCs; interactive confirmation pieces (`sign-confirm.tsx`, `chart.tsx`) are `"use client"` islands.
- Never `setAll` cookies from an RSC — `lib/supabase/server.ts` catches that with an empty try/catch per Supabase's SSR design. Session mutation only runs from Server Actions, Route Handlers, or `proxy.ts`.

## Routing quirks you will hit
- Next rejects sibling segments with different dynamic names at the same level. We ran into this with `app/notes/[appointmentId]/new/` + `app/notes/[id]/`. Fixed by moving creation under a static segment: **`app/notes/new/[appointmentId]/`**. If you add another creation route, keep the static segment pattern.
- Routes that read DB data declare `export const dynamic = "force-dynamic"` so the page re-renders on each request in dev + doesn't get baked at build time.

## Server Actions pattern
- Located as `actions.ts` next to the pages that use them.
- Always `"use server"` at the top.
- After a write, call `revalidatePath(...)` for every surface that might show the changed row, then optionally `redirect(...)`.
- Actions accept either `(formData: FormData)` or `(id: string, formData: FormData)` and are bound in the page with `action.bind(null, id)`.
- Zod validation lives in `lib/validation/*` — actions call `parseNoteContent(...)` rather than inline schemas so the validators are reusable from unit tests.

## Forms + Radix AlertDialog sign-and-lock trick
The progress-note page uses `<form id="newNoteForm">` and the `AlertDialog.Action` button declares `form="newNoteForm"` + `name="intent" value="sign"`. The dialog is rendered via a React portal so a nested submit button wouldn't reach the form otherwise. Keep this pattern if you add other "confirm-then-submit" flows.

## Radix Themes conventions used here
- Multi-part components are always used via dot-notation: `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`, `Table.Root` / `Table.Header` / `Table.Row` / `Table.ColumnHeaderCell`, `AlertDialog.Root` / `Content` / `Trigger` / `Action` / `Cancel`.
- Colour choices are theme tokens (`var(--indigo-3)`, etc.), never raw hex.
- CSS import order in `app/layout.tsx` matters: `@radix-ui/themes/styles.css` **before** `./globals.css`.

## Feature layout
- `/` — dashboard RSC; pulls today's appts + unsigned notes + recent clients in parallel via `Promise.all`.
- `/clients`, `/clients/new`, `/clients/[id]`, `/clients/[id]/intake`.
- `/appointments` (week view), `/appointments/new`, `/appointments/[id]`.
- `/notes/[id]` (view + addendum), `/notes/new/[appointmentId]` (create).
- `/assessments/[clientId]/phq9/new`, `/assessments/[clientId]/history` (chart + table).

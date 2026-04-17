import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:64321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

export function anonClient() {
  return createClient<Database>(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function serviceClient() {
  return createClient<Database>(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const SEEDED_CLINICIAN = "11111111-1111-1111-1111-111111111111";
export const SEED_CLIENT_JAMIE = "22222222-2222-2222-2222-222222222221";
export const SEED_CLIENT_TAYLOR = "22222222-2222-2222-2222-222222222222";
export const SEED_APPT_FUTURE  = "33333333-3333-3333-3333-333333333331";
export const SEED_APPT_PAST    = "33333333-3333-3333-3333-333333333333";
export const SEED_NOTE_SIGNED  = "44444444-4444-4444-4444-444444444441";

// Clean up rows created during a test. Uses service client to bypass RLS.
export async function cleanupRowsById(table: string, ids: string[]) {
  if (ids.length === 0) return;
  const svc = serviceClient();
  // @ts-expect-error dynamic table name is intentional for test helpers
  await svc.from(table).delete().in("id", ids);
}

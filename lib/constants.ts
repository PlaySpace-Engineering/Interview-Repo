// Single source of truth for the hardcoded clinician the POC runs as.
// Mirrored in supabase/seed.sql and supabase/migrations/0002_rls.sql.
export const SEEDED_CLINICIAN_ID = "11111111-1111-1111-1111-111111111111";

export const CPT_CODES = {
  "90791": "Intake / Diagnostic evaluation",
  "90832": "Psychotherapy, 30 min",
  "90834": "Psychotherapy, 45 min",
  "90837": "Psychotherapy, 60 min",
} as const;

export const APPT_STATUSES = [
  "scheduled",
  "confirmed",
  "attended",
  "no_show",
  "late_cancel",
] as const;

export const CLIENT_STATUSES = [
  "active",
  "inactive",
  "waitlist",
  "discharged",
] as const;

export const INTERVENTIONS = [
  "Cognitive restructuring",
  "Behavioural activation",
  "Exposure",
  "Mindfulness",
  "Psychoeducation",
  "Motivational interviewing",
  "Interpersonal work",
  "Relapse prevention",
] as const;

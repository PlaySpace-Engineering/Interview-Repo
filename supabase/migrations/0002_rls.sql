-- Row Level Security keyed to a fixed seeded clinician UUID.
-- The POC has no auth layer, so policies use a hardcoded UUID that matches
-- the one baked into lib/constants.ts + seed.sql. This demonstrates the
-- pattern (cross-clinician reads are blocked) without building sign-in.

-- Keep the constant in one place: a SQL function the policies call.
create or replace function seeded_clinician_id()
returns uuid language sql immutable as $$
  select '11111111-1111-1111-1111-111111111111'::uuid
$$;

alter table clinicians      enable row level security;
alter table clients         enable row level security;
alter table intake_forms    enable row level security;
alter table appointments    enable row level security;
alter table progress_notes  enable row level security;
alter table note_addendums  enable row level security;
alter table assessments     enable row level security;

-- Clinicians: read own row only.
create policy clinicians_self on clinicians
  for all using (id = seeded_clinician_id())
  with check (id = seeded_clinician_id());

-- Clients: scoped to seeded clinician.
create policy clients_owner on clients
  for all using (clinician_id = seeded_clinician_id())
  with check (clinician_id = seeded_clinician_id());

-- Intake forms: joined via client ownership.
create policy intake_forms_owner on intake_forms
  for all using (
    exists (
      select 1 from clients c
      where c.id = intake_forms.client_id
        and c.clinician_id = seeded_clinician_id()
    )
  )
  with check (
    exists (
      select 1 from clients c
      where c.id = intake_forms.client_id
        and c.clinician_id = seeded_clinician_id()
    )
  );

create policy appointments_owner on appointments
  for all using (clinician_id = seeded_clinician_id())
  with check (clinician_id = seeded_clinician_id());

create policy progress_notes_owner on progress_notes
  for all using (clinician_id = seeded_clinician_id())
  with check (clinician_id = seeded_clinician_id());

create policy note_addendums_owner on note_addendums
  for all using (
    exists (
      select 1 from progress_notes n
      where n.id = note_addendums.note_id
        and n.clinician_id = seeded_clinician_id()
    )
  )
  with check (
    exists (
      select 1 from progress_notes n
      where n.id = note_addendums.note_id
        and n.clinician_id = seeded_clinician_id()
    )
  );

create policy assessments_owner on assessments
  for all using (clinician_id = seeded_clinician_id())
  with check (clinician_id = seeded_clinician_id());

-- Anon role gets access through RLS. Grants are required for anon to use the
-- REST API at all; RLS then restricts which rows it sees.
grant usage on schema public to anon;
grant all on all tables in schema public to anon;
grant all on all sequences in schema public to anon;
alter default privileges in schema public grant all on tables to anon;
alter default privileges in schema public grant all on sequences to anon;

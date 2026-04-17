-- EHR POC — initial schema
-- Designed so DB-level invariants (constraints, generated cols, triggers)
-- can be asserted from tests.

create extension if not exists "uuid-ossp";

-- Enums --------------------------------------------------------------------
create type client_status as enum ('active', 'inactive', 'waitlist', 'discharged');
create type appt_location as enum ('in_person', 'telehealth', 'phone');
create type cpt_code      as enum ('90791', '90832', '90834', '90837');
create type appt_status   as enum ('scheduled', 'confirmed', 'attended', 'no_show', 'late_cancel');
create type note_format   as enum ('SOAP', 'DAP');
create type instrument    as enum ('PHQ-9');

-- Tables -------------------------------------------------------------------
create table clinicians (
  id             uuid primary key default uuid_generate_v4(),
  legal_name     text not null,
  email          text not null unique,
  license_number text,
  created_at     timestamptz not null default now()
);

create table clients (
  id                      uuid primary key default uuid_generate_v4(),
  clinician_id            uuid not null references clinicians(id) on delete cascade,
  legal_name              text not null,
  preferred_name          text,
  pronouns                text,
  dob                     date,
  phone                   text,
  email                   text,
  emergency_contact_name  text not null,
  emergency_contact_phone text not null,
  status                  client_status not null default 'active',
  intake_date             date,
  created_at              timestamptz not null default now()
);

create index clients_clinician_idx on clients(clinician_id);

create table intake_forms (
  id                        uuid primary key default uuid_generate_v4(),
  client_id                 uuid not null unique references clients(id) on delete cascade,
  presenting_problem        text not null,
  symptom_duration          text,
  medications               text[] not null default '{}',
  allergies                 text[] not null default '{}',
  prior_treatment           text,
  suicidal_ideation_screen  boolean not null default false,
  consent_signed_at         timestamptz,
  hipaa_ack_signed_at       timestamptz,
  created_at                timestamptz not null default now()
);

create table appointments (
  id           uuid primary key default uuid_generate_v4(),
  clinician_id uuid not null references clinicians(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  start_at     timestamptz not null,
  end_at       timestamptz not null,
  location     appt_location not null default 'in_person',
  cpt_code     cpt_code not null default '90834',
  status       appt_status not null default 'scheduled',
  created_at   timestamptz not null default now(),
  check (end_at > start_at)
);

create index appointments_clinician_start_idx on appointments(clinician_id, start_at);
create index appointments_client_idx on appointments(client_id);

create table progress_notes (
  id                 uuid primary key default uuid_generate_v4(),
  appointment_id     uuid not null unique references appointments(id) on delete cascade,
  client_id          uuid not null references clients(id) on delete cascade,
  clinician_id       uuid not null references clinicians(id) on delete cascade,
  format             note_format not null,
  content            jsonb not null,
  interventions_used text[] not null default '{}',
  risk_assessment    jsonb not null default '{"si":false,"hi":false,"self_harm":false}'::jsonb,
  signed_at          timestamptz,
  locked             boolean not null default false,
  created_at         timestamptz not null default now()
);

create index progress_notes_client_idx on progress_notes(client_id);

create table note_addendums (
  id         uuid primary key default uuid_generate_v4(),
  note_id    uuid not null references progress_notes(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index note_addendums_note_idx on note_addendums(note_id);

-- Assessments: generated columns let tests hit DB-level invariants.
create table assessments (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references clients(id) on delete cascade,
  clinician_id     uuid not null references clinicians(id) on delete cascade,
  instrument       instrument not null default 'PHQ-9',
  administered_at  timestamptz not null default now(),
  responses        int[] not null,
  total_score      int  generated always as (
                        coalesce(responses[1],0) + coalesce(responses[2],0) + coalesce(responses[3],0)
                      + coalesce(responses[4],0) + coalesce(responses[5],0) + coalesce(responses[6],0)
                      + coalesce(responses[7],0) + coalesce(responses[8],0) + coalesce(responses[9],0)
                   ) stored,
  severity_band    text generated always as (
                     case
                       when (
                         coalesce(responses[1],0) + coalesce(responses[2],0) + coalesce(responses[3],0)
                       + coalesce(responses[4],0) + coalesce(responses[5],0) + coalesce(responses[6],0)
                       + coalesce(responses[7],0) + coalesce(responses[8],0) + coalesce(responses[9],0)
                       ) between 0  and 4  then 'None'
                       when (
                         coalesce(responses[1],0) + coalesce(responses[2],0) + coalesce(responses[3],0)
                       + coalesce(responses[4],0) + coalesce(responses[5],0) + coalesce(responses[6],0)
                       + coalesce(responses[7],0) + coalesce(responses[8],0) + coalesce(responses[9],0)
                       ) between 5  and 9  then 'Mild'
                       when (
                         coalesce(responses[1],0) + coalesce(responses[2],0) + coalesce(responses[3],0)
                       + coalesce(responses[4],0) + coalesce(responses[5],0) + coalesce(responses[6],0)
                       + coalesce(responses[7],0) + coalesce(responses[8],0) + coalesce(responses[9],0)
                       ) between 10 and 14 then 'Moderate'
                       when (
                         coalesce(responses[1],0) + coalesce(responses[2],0) + coalesce(responses[3],0)
                       + coalesce(responses[4],0) + coalesce(responses[5],0) + coalesce(responses[6],0)
                       + coalesce(responses[7],0) + coalesce(responses[8],0) + coalesce(responses[9],0)
                       ) between 15 and 19 then 'Moderately Severe'
                       else 'Severe'
                     end
                   ) stored,
  si_flag          boolean generated always as (coalesce(responses[9],0) > 0) stored,
  created_at       timestamptz not null default now(),

  constraint phq9_length_check check (array_length(responses, 1) = 9),
  constraint phq9_range_check  check (
       responses[1] between 0 and 3
   and responses[2] between 0 and 3
   and responses[3] between 0 and 3
   and responses[4] between 0 and 3
   and responses[5] between 0 and 3
   and responses[6] between 0 and 3
   and responses[7] between 0 and 3
   and responses[8] between 0 and 3
   and responses[9] between 0 and 3
  )
);

create index assessments_client_admin_idx on assessments(client_id, administered_at);

-- Note-lock trigger --------------------------------------------------------
-- Once locked = true, disallow any UPDATE on progress_notes (addendums go to
-- note_addendums). Sign happens via a single UPDATE that sets signed_at +
-- locked = true atomically; that UPDATE is allowed because the OLD row still
-- had locked = false when the trigger fires.
create or replace function prevent_locked_note_update()
returns trigger language plpgsql as $$
begin
  if OLD.locked = true then
    raise exception 'progress_notes row is locked (id=%) and cannot be updated', OLD.id
      using errcode = 'check_violation';
  end if;
  return NEW;
end;
$$;

create trigger progress_notes_lock_guard
before update on progress_notes
for each row execute function prevent_locked_note_update();

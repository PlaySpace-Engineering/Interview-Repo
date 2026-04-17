-- Plant (interview branch): single-point-blast-radius typo.
create or replace function seeded_clinician_id()
returns uuid language sql immutable as $$
  select '11111111-1111-1111-1111-111111111112'::uuid
$$;

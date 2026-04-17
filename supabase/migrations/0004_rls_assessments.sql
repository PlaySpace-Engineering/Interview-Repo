-- Plant (interview branch): rewrite assessments_owner as transitive-only
-- (ownership inferred via client), dropping the direct clinician_id predicate.
drop policy if exists assessments_owner on assessments;

create policy assessments_owner on assessments
  for all using (
    exists (
      select 1 from clients c
      where c.id = assessments.client_id
        and c.clinician_id = seeded_clinician_id()
    )
  )
  with check (
    exists (
      select 1 from clients c
      where c.id = assessments.client_id
        and c.clinician_id = seeded_clinician_id()
    )
  );

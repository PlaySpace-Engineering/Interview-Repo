-- Plant (interview branch): loosen clinicians_self USING to `true`, leaving
-- WITH CHECK intact. The policy now discloses every clinician row to anon.
drop policy if exists clinicians_self on clinicians;

create policy clinicians_self on clinicians
  for all using (true)
  with check (id = seeded_clinician_id());

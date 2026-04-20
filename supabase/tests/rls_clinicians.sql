-- pgTAP: anon must only see the seeded clinician, not foreign rows.
begin;

create extension if not exists pgtap;

select plan(2);

-- Insert a foreign clinician as the owner role (bypasses RLS in this transaction).
insert into clinicians (id, legal_name, email)
values ('99999999-9999-9999-9999-999999999990', 'Dr. Ghost', 'ghost@example.com')
on conflict (id) do nothing;

set local role anon;

-- Seeded clinician must remain visible.
select is(
  (select count(*)::int from clinicians where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'anon can see the seeded clinician'
);

-- Foreign clinician must be hidden by RLS.
select is(
  (select count(*)::int from clinicians where id = '99999999-9999-9999-9999-999999999990'),
  0,
  'anon cannot see a foreign clinician'
);

select * from finish();
rollback;

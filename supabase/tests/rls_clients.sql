-- pgTAP: RLS on clients — seeded clinician sees own; another clinician doesn't.
begin;

create extension if not exists pgtap;

select plan(4);

-- Running as the anon role, RLS should restrict reads to seeded clinician's clients.
set local role anon;

select cmp_ok(
  (select count(*)::int from clients where clinician_id = '11111111-1111-1111-1111-111111111111'),
  '>=',
  3,
  'anon can read seeded clinician clients via RLS'
);

-- Attempting to insert for a *different* clinician must be blocked by RLS WITH CHECK.
prepare bad_insert as
  insert into clients (clinician_id, legal_name, emergency_contact_name, emergency_contact_phone)
  values ('99999999-9999-9999-9999-999999999999', 'Ghost Client', 'Ghost Kin', '555-9999');

select throws_ok(
  'bad_insert',
  '42501',
  null,
  'anon cannot insert clients for a foreign clinician'
);

-- Attempting to read rows for a foreign clinician returns zero.
select is(
  (select count(*)::int from clients where clinician_id = '99999999-9999-9999-9999-999999999999'),
  0,
  'anon cannot see foreign clinician clients'
);

-- Insert for the seeded clinician is allowed.
insert into clients (clinician_id, legal_name, emergency_contact_name, emergency_contact_phone)
values ('11111111-1111-1111-1111-111111111111', 'Temp Test Client', 'Kin', '555-0000');

select ok(
  exists(select 1 from clients where legal_name = 'Temp Test Client'),
  'anon can insert clients for seeded clinician'
);

select * from finish();
rollback;

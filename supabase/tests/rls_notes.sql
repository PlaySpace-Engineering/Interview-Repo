-- pgTAP: RLS on progress_notes + note_addendums.
begin;

create extension if not exists pgtap;

select plan(3);

set local role anon;

-- Seeded signed note should be visible.
select is(
  (select count(*)::int from progress_notes
     where id = '44444444-4444-4444-4444-444444444441'),
  1,
  'anon can read seeded progress_note'
);

-- Inserting a note for a foreign clinician is blocked.
prepare bad_note_insert as
  insert into progress_notes (appointment_id, client_id, clinician_id, format, content)
  values ('33333333-3333-3333-3333-333333333331',
          '22222222-2222-2222-2222-222222222221',
          '99999999-9999-9999-9999-999999999999',
          'SOAP',
          '{"subjective":"x","objective":"x","assessment":"x","plan":"x"}'::jsonb);

select throws_ok(
  'bad_note_insert',
  '42501',
  null,
  'anon cannot write progress_notes for a foreign clinician'
);

-- Inserting an addendum on a seeded note should succeed.
insert into note_addendums (note_id, content)
values ('44444444-4444-4444-4444-444444444441', 'Follow-up: client confirmed med adherence.');

select ok(
  exists(select 1 from note_addendums where note_id = '44444444-4444-4444-4444-444444444441'),
  'anon can append addendum to seeded note'
);

select * from finish();
rollback;

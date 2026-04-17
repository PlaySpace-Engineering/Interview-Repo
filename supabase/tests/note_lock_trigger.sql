-- pgTAP: once progress_notes.locked = true, UPDATEs raise.
begin;

create extension if not exists pgtap;

select plan(3);

-- Sign & lock is a single UPDATE — allowed because OLD.locked was false.
update progress_notes
   set signed_at = now(), locked = true
 where id = '44444444-4444-4444-4444-444444444441'
   and locked = false;
-- (seed already locks it; if already locked this is a no-op via WHERE)

-- Subsequent edit attempt must raise.
prepare edit_locked as
  update progress_notes set content = '{"subjective":"edited"}'::jsonb
  where id = '44444444-4444-4444-4444-444444444441';

select throws_ok(
  'edit_locked',
  '23514', -- check_violation errcode we raise
  null,
  'updating a locked note raises'
);

-- Unlock attempt must also raise (can't bypass by toggling locked off).
prepare try_unlock as
  update progress_notes set locked = false
  where id = '44444444-4444-4444-4444-444444444441';

select throws_ok(
  'try_unlock',
  '23514',
  null,
  'cannot unlock a locked note'
);

-- Addendums are independent rows on a separate table → still work.
insert into note_addendums (note_id, content)
values ('44444444-4444-4444-4444-444444444441', 'Post-lock addendum');

select ok(
  exists(
    select 1 from note_addendums
     where note_id = '44444444-4444-4444-4444-444444444441'
       and content = 'Post-lock addendum'
  ),
  'addendum still insertable after note lock'
);

select * from finish();
rollback;

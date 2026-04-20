-- Plant (interview branch): drop the UNIQUE constraint that enforces
-- one progress note per appointment. App still assumes 1:1.
alter table progress_notes drop constraint progress_notes_appointment_id_key;

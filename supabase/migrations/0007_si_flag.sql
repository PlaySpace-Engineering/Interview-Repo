-- Plant (interview branch): si_flag now true for every row (>= 0 is always true).
alter table assessments drop column si_flag;

alter table assessments add column si_flag boolean generated always as (
  coalesce(responses[9],0) >= 0
) stored;

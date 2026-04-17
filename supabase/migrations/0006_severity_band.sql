-- Plant (interview branch): severity_band "None" window shifted to 0..3.
-- A score of 4 now reports "Mild" instead of "None", diverging from the
-- JS severityBand() in lib/validation/phq9.ts.
alter table assessments drop column severity_band;

alter table assessments add column severity_band text generated always as (
  case
    when (
      coalesce(responses[1],0) + coalesce(responses[2],0) + coalesce(responses[3],0)
    + coalesce(responses[4],0) + coalesce(responses[5],0) + coalesce(responses[6],0)
    + coalesce(responses[7],0) + coalesce(responses[8],0) + coalesce(responses[9],0)
    ) between 0  and 3  then 'None'
    when (
      coalesce(responses[1],0) + coalesce(responses[2],0) + coalesce(responses[3],0)
    + coalesce(responses[4],0) + coalesce(responses[5],0) + coalesce(responses[6],0)
    + coalesce(responses[7],0) + coalesce(responses[8],0) + coalesce(responses[9],0)
    ) between 4  and 9  then 'Mild'
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
) stored;

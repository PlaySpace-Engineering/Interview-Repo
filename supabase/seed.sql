-- Deterministic seed for the POC. UUIDs match lib/constants.ts.

insert into clinicians (id, legal_name, email, license_number)
values (
  '11111111-1111-1111-1111-111111111111',
  'Dr. Alex Rivera, PsyD',
  'alex.rivera@example.com',
  'PSY-000123'
)
on conflict (id) do nothing;

insert into clients (id, clinician_id, legal_name, preferred_name, pronouns, dob, phone, email,
                     emergency_contact_name, emergency_contact_phone, status, intake_date)
values
  ('22222222-2222-2222-2222-222222222221',
   '11111111-1111-1111-1111-111111111111',
   'Jamie Chen', 'Jamie', 'they/them', '1992-06-14', '555-0101', 'jamie@example.com',
   'Morgan Chen', '555-0102', 'active', '2026-01-10'),
  ('22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111',
   'Taylor Okafor', 'Tay', 'she/her', '1988-11-03', '555-0201', 'taylor@example.com',
   'Sam Okafor', '555-0202', 'active', '2026-02-15'),
  ('22222222-2222-2222-2222-222222222223',
   '11111111-1111-1111-1111-111111111111',
   'River Park', null, 'he/him', '2001-03-22', '555-0301', 'river@example.com',
   'Jordan Park', '555-0302', 'waitlist', null)
on conflict (id) do nothing;

insert into intake_forms (client_id, presenting_problem, symptom_duration, medications,
                          allergies, prior_treatment, consent_signed_at, hipaa_ack_signed_at)
values
  ('22222222-2222-2222-2222-222222222221',
   'Persistent low mood, anhedonia, difficulty concentrating at work.',
   '4 months',
   '{"Sertraline 50mg"}',
   '{}',
   'Brief CBT in college (2014).',
   now() - interval '90 days',
   now() - interval '90 days'),
  ('22222222-2222-2222-2222-222222222222',
   'Panic attacks triggered by driving; avoidance behaviours.',
   '6 weeks',
   '{}',
   '{"Penicillin"}',
   null,
   now() - interval '60 days',
   now() - interval '60 days')
on conflict (client_id) do nothing;

insert into appointments (id, clinician_id, client_id, start_at, end_at, location, cpt_code, status)
values
  ('33333333-3333-3333-3333-333333333331',
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222221',
   date_trunc('day', now()) + interval '14 hour',
   date_trunc('day', now()) + interval '14 hour 45 minute',
   'in_person', '90834', 'scheduled'),
  ('33333333-3333-3333-3333-333333333332',
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222',
   date_trunc('day', now()) + interval '16 hour',
   date_trunc('day', now()) + interval '16 hour 60 minute',
   'telehealth', '90837', 'confirmed'),
  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222221',
   now() - interval '7 days',
   now() - interval '7 days' + interval '45 minute',
   'in_person', '90834', 'attended')
on conflict (id) do nothing;

-- Signed progress note on the past attended appointment.
insert into progress_notes (id, appointment_id, client_id, clinician_id, format, content,
                            interventions_used, risk_assessment, signed_at, locked)
values (
  '44444444-4444-4444-4444-444444444441',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'SOAP',
  jsonb_build_object(
    'subjective', 'Client reports continued low mood; sleep improving.',
    'objective',  'Appeared tired but engaged. Affect congruent.',
    'assessment', 'MDD, moderate — slow symptom improvement on SSRI.',
    'plan',       'Continue weekly CBT; PHQ-9 next session; Rx unchanged.'
  ),
  '{"cognitive restructuring","behavioural activation"}',
  '{"si":false,"hi":false,"self_harm":false}'::jsonb,
  now() - interval '7 days',
  true
)
on conflict (id) do nothing;

-- Longitudinal PHQ-9 history for the first client (three data points, trending down).
insert into assessments (client_id, clinician_id, administered_at, responses)
values
  ('22222222-2222-2222-2222-222222222221',
   '11111111-1111-1111-1111-111111111111',
   now() - interval '60 days', '{3,3,2,2,3,2,2,2,1}'),
  ('22222222-2222-2222-2222-222222222221',
   '11111111-1111-1111-1111-111111111111',
   now() - interval '30 days', '{2,2,2,2,2,1,1,2,0}'),
  ('22222222-2222-2222-2222-222222222221',
   '11111111-1111-1111-1111-111111111111',
   now() - interval '7 days',  '{2,1,2,1,1,1,1,1,0}');

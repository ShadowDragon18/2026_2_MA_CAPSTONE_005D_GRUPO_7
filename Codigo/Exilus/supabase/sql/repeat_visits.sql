alter table public.consultations
  drop constraint if exists consultations_patient_id_key;

alter table public.patients
  add column if not exists current_visit_id uuid;

alter table public.consultations
  add column if not exists visit_id uuid;

update public.patients
set current_visit_id = gen_random_uuid()
where current_visit_id is null;

update public.consultations as consultation
set visit_id = patient.current_visit_id
from public.patients as patient
where consultation.patient_id = patient.id
  and consultation.visit_id is null;

create index if not exists consultations_patient_visit_idx
  on public.consultations (patient_id, visit_id);

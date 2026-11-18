alter table public.patients drop constraint if exists patients_benefit_check;

alter table public.patients
  add constraint patients_benefit_check
  check (
    benefit is null
    or benefit in ('Fonasa', 'Fonasa A', 'Bloqueado', 'Extranjero', 'No se pudo')
  );

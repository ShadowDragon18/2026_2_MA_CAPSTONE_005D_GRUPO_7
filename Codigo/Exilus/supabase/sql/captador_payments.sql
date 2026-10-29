alter table public.clinic_settings
  add column if not exists default_captador_amount numeric(12, 2) not null default 1000;

alter table public.clinic_settings
  drop constraint if exists clinic_settings_captador_amount_non_negative;

alter table public.clinic_settings
  add constraint clinic_settings_captador_amount_non_negative
  check (default_captador_amount >= 0);

alter table public.captadores
  add column if not exists amount numeric(12, 2) not null default 1000;

alter table public.captadores
  add column if not exists payment_status text not null default 'Por pagar';

alter table public.captadores
  drop constraint if exists captadores_amount_non_negative;

alter table public.captadores
  add constraint captadores_amount_non_negative
  check (amount >= 0);

alter table public.captadores
  drop constraint if exists captadores_payment_status_check;

alter table public.captadores
  add constraint captadores_payment_status_check
  check (payment_status in ('Pagado', 'Por pagar'));

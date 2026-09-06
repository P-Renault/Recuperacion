-- ============================================================
-- RECUPERACIÓN v3 — CARTA DEL ÁNIMO + RUTINAS + RECORDATORIOS
-- Ejecutar completa en Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.mood_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  entry_date date not null,
  sleep_hours numeric(4,1),
  exercise_minutes integer,
  racing_thoughts text default 'Sin registro',
  anguish_desperation text default 'Sin registro',
  irritability text default 'Sin registro',
  elevated_mood text default 'Sin registro',
  low_mood text default 'Sin registro',
  menstrual_period text default 'Sin registro',
  psychosis text default 'Sin registro',
  alcohol_marijuana text default 'Sin registro',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, entry_date)
);

alter table public.mood_daily add column if not exists sleep_hours numeric(4,1);
alter table public.mood_daily add column if not exists exercise_minutes integer;
alter table public.mood_daily add column if not exists racing_thoughts text default 'Sin registro';
alter table public.mood_daily add column if not exists anguish_desperation text default 'Sin registro';
alter table public.mood_daily add column if not exists irritability text default 'Sin registro';
alter table public.mood_daily add column if not exists elevated_mood text default 'Sin registro';
alter table public.mood_daily add column if not exists low_mood text default 'Sin registro';
alter table public.mood_daily add column if not exists menstrual_period text default 'Sin registro';
alter table public.mood_daily add column if not exists psychosis text default 'Sin registro';
alter table public.mood_daily add column if not exists alcohol_marijuana text default 'Sin registro';
alter table public.mood_daily add column if not exists notes text;
alter table public.mood_daily add column if not exists created_at timestamptz default now();
alter table public.mood_daily add column if not exists updated_at timestamptz default now();

create table if not exists public.mood_medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  medication_name text not null,
  daily_dose text,
  doses_per_day integer default 1,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mood_medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  medication_id uuid references public.mood_medications(id) on delete cascade,
  entry_date date not null,
  taken boolean default false,
  doses_taken integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(medication_id, entry_date)
);

create table if not exists public.routine_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  start_time time not null,
  title text not null,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mood_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  reminder_time time not null default '21:00',
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_mood_daily_user_date on public.mood_daily(user_id, entry_date desc);
create index if not exists idx_medications_user on public.mood_medications(user_id);
create index if not exists idx_medication_logs_user_date on public.mood_medication_logs(user_id, entry_date desc);
create index if not exists idx_routine_user_time on public.routine_items(user_id, start_time);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_mood_daily_updated on public.mood_daily;
create trigger trg_mood_daily_updated before update on public.mood_daily
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_medications_updated on public.mood_medications;
create trigger trg_medications_updated before update on public.mood_medications
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_medication_logs_updated on public.mood_medication_logs;
create trigger trg_medication_logs_updated before update on public.mood_medication_logs
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_routine_updated on public.routine_items;
create trigger trg_routine_updated before update on public.routine_items
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_reminders_updated on public.mood_reminders;
create trigger trg_reminders_updated before update on public.mood_reminders
for each row execute function public.update_updated_at_column();

alter table public.mood_daily enable row level security;
alter table public.mood_medications enable row level security;
alter table public.mood_medication_logs enable row level security;
alter table public.routine_items enable row level security;
alter table public.mood_reminders enable row level security;

drop policy if exists mood_daily_select on public.mood_daily;
drop policy if exists mood_daily_insert on public.mood_daily;
drop policy if exists mood_daily_update on public.mood_daily;
drop policy if exists mood_daily_delete on public.mood_daily;
create policy mood_daily_select on public.mood_daily for select to authenticated using(auth.uid()=user_id);
create policy mood_daily_insert on public.mood_daily for insert to authenticated with check(auth.uid()=user_id);
create policy mood_daily_update on public.mood_daily for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy mood_daily_delete on public.mood_daily for delete to authenticated using(auth.uid()=user_id);

drop policy if exists medication_select on public.mood_medications;
drop policy if exists medication_insert on public.mood_medications;
drop policy if exists medication_update on public.mood_medications;
drop policy if exists medication_delete on public.mood_medications;
create policy medication_select on public.mood_medications for select to authenticated using(auth.uid()=user_id);
create policy medication_insert on public.mood_medications for insert to authenticated with check(auth.uid()=user_id);
create policy medication_update on public.mood_medications for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy medication_delete on public.mood_medications for delete to authenticated using(auth.uid()=user_id);

drop policy if exists medication_log_select on public.mood_medication_logs;
drop policy if exists medication_log_insert on public.mood_medication_logs;
drop policy if exists medication_log_update on public.mood_medication_logs;
drop policy if exists medication_log_delete on public.mood_medication_logs;
create policy medication_log_select on public.mood_medication_logs for select to authenticated using(auth.uid()=user_id);
create policy medication_log_insert on public.mood_medication_logs for insert to authenticated with check(auth.uid()=user_id);
create policy medication_log_update on public.mood_medication_logs for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy medication_log_delete on public.mood_medication_logs for delete to authenticated using(auth.uid()=user_id);

drop policy if exists routine_select on public.routine_items;
drop policy if exists routine_insert on public.routine_items;
drop policy if exists routine_update on public.routine_items;
drop policy if exists routine_delete on public.routine_items;
create policy routine_select on public.routine_items for select to authenticated using(auth.uid()=user_id);
create policy routine_insert on public.routine_items for insert to authenticated with check(auth.uid()=user_id);
create policy routine_update on public.routine_items for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy routine_delete on public.routine_items for delete to authenticated using(auth.uid()=user_id);

drop policy if exists reminder_select on public.mood_reminders;
drop policy if exists reminder_insert on public.mood_reminders;
drop policy if exists reminder_update on public.mood_reminders;
drop policy if exists reminder_delete on public.mood_reminders;
create policy reminder_select on public.mood_reminders for select to authenticated using(auth.uid()=user_id);
create policy reminder_insert on public.mood_reminders for insert to authenticated with check(auth.uid()=user_id);
create policy reminder_update on public.mood_reminders for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy reminder_delete on public.mood_reminders for delete to authenticated using(auth.uid()=user_id);

select table_name from information_schema.tables
where table_schema='public'
and table_name in ('mood_daily','mood_medications','mood_medication_logs','routine_items','mood_reminders')
order by table_name;
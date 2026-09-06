-- Recuperación y Rutina Personal v2
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.mood_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  entry_date date not null,
  sleep_hours numeric(4,1),
  exercise_minutes integer,
  racing_thoughts text,
  anguish_desperation text,
  irritability text,
  elevated_mood text,
  low_mood text,
  menstrual_period text,
  psychosis text,
  alcohol_marijuana text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, entry_date)
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

alter table public.mood_daily enable row level security;
alter table public.routine_items enable row level security;
alter table public.mood_reminders enable row level security;

drop policy if exists mood_daily_select on public.mood_daily;
drop policy if exists mood_daily_insert on public.mood_daily;
drop policy if exists mood_daily_update on public.mood_daily;
drop policy if exists mood_daily_delete on public.mood_daily;
create policy mood_daily_select on public.mood_daily for select using (auth.uid() = user_id);
create policy mood_daily_insert on public.mood_daily for insert with check (auth.uid() = user_id);
create policy mood_daily_update on public.mood_daily for update using (auth.uid() = user_id);
create policy mood_daily_delete on public.mood_daily for delete using (auth.uid() = user_id);

drop policy if exists routine_select on public.routine_items;
drop policy if exists routine_insert on public.routine_items;
drop policy if exists routine_update on public.routine_items;
drop policy if exists routine_delete on public.routine_items;
create policy routine_select on public.routine_items for select using (auth.uid() = user_id);
create policy routine_insert on public.routine_items for insert with check (auth.uid() = user_id);
create policy routine_update on public.routine_items for update using (auth.uid() = user_id);
create policy routine_delete on public.routine_items for delete using (auth.uid() = user_id);

drop policy if exists reminder_select on public.mood_reminders;
drop policy if exists reminder_insert on public.mood_reminders;
drop policy if exists reminder_update on public.mood_reminders;
create policy reminder_select on public.mood_reminders for select using (auth.uid() = user_id);
create policy reminder_insert on public.mood_reminders for insert with check (auth.uid() = user_id);
create policy reminder_update on public.mood_reminders for update using (auth.uid() = user_id);

-- Si ya existe un usuario autenticado, la app guardará sus registros asociados a auth.uid().